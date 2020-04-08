function deep_copy(object){
    return JSON.parse(JSON.stringify(object));
}

const operators = {
    ADD: "+",
    SUB: "-",
    MUL: "*",
    DIV: "/",
    EQ: "=",
    GEQ: ">=",
    LEQ: "<=",
    GT: ">",
    LT: "<"
};

const aggregates = ["max", "min", "none"];

function err(msg, log){
    alert(msg);
    console.log(log);
}

class expression{
    constructor(lhs, op, rhs){
        if(!(typeof(lhs) == "string") || !(typeof(rhs) == "string")) {
            err("in get expr", JSON.stringify([lhs, op, rhs, typeof(rhs)]));
            return;
        }

        this.lhs = lhs;
        this.op = op;
        this.rhs = rhs;
    }

    dumps(){
        return this.lhs + " " + operators[this.op] + " " + this.rhs;
    }
}

class Query{
    constructor(){
        this.cols=JSON.parse(document.getElementById("data_store").getAttribute("data"));
        
        this.projected = deep_copy(this.cols);

        this.aggregates = []; 
        for(let i=0;i<this.cols.length;i++) this.aggregates.push("none");
        this.num_aggregates = 0;

        this.where = [];
    }
    
    remove_project(col_name){
        let idx = this.projected.indexOf(col_name);
        if(idx==-1){
            err("remove project: col_name not is project", JSON.stringify([col_name, this.projected]) );
            return;
        }

        this.projected.splice(idx, 1);
        this.aggregates.splice(idx,1);
    }

    add_project(col_name){
        if(this.cols.indexOf(col_name)==-1){
            err("add_project: col_name not in cols",JSON.stringify([col_name, this.cols]) );
            return;
        }

        if(this.projected.indexOf(col_name)!=-1) {
            err("add_project: col_name already in projected",JSON.stringify([col_name, this.projected]) );
            return;
        }

        this.projected.push(col_name);
        this.aggregates.push("none");
    }

    add_where(lhs, op, rhs){
        this.where.push(new expression(lhs, op, rhs));
    }

    add_aggregate(agg, col_name){
        if(!aggregates.includes(agg)){
            err("in add_aggregate: aggregate not in all aggregates", JSON.stringify([agg, col_name, this]));
            return;
        }

        let idx = this.projected.indexOf(col_name);

        if(idx==-1) {
            err("in add_aggregate: col_name not in projected cols", JSON.stringify([agg, col_name, this]));
            return;
        }

        if(agg!="none" && this.aggregates[idx]=="none") this.num_aggregates+=1;
        if(agg=="none" && this.aggregates[idx]!="none") this.num_aggregates-=1;
        this.aggregates[idx] = agg;
        return;
    }

    dumps(){

        if(this.num_aggregates==1){
            let i;
            for(i=0;i<this.aggregates.length && this.aggregates[i]=="none";i++);
            
            let agg = this.aggregates[i];
            let col_name = this.projected[i];

            this.add_where(agg+"("+col_name+")", "EQ", col_name);
        } 
        
        let select_list = ""
        for(let i=0;i<this.projected.length; i++){
            let col_name = this.projected[i];
            let agg = this.aggregates[i];
            let cur = "";

            if(agg=="none") cur = col_name;
            else cur = agg+"("+col_name+")";
            select_list = select_list + " " + cur;

            if(i!=this.projected.length-1) select_list = select_list + ",";
        }

        let where_list = "";
        for(let i=0;i<this.where.length;i++)
            where_list = where_list + " " + this.where[i].dumps();

        if(this.num_aggregates==1) this.where.pop();
        
        return "select" + select_list + " from table"+ (where_list==""? "":" where" + where_list) + ";";
    }

    display(){
        if(!this.validate()){
            error_banner = document.getElementById("error_banner");
            error_banner.style.display = "block";
            error_banner.innerHTML = "please select either 1 aggregate or all";

            document.getElementById("query_display").style.display="none";
        }
        else{
            let display_elem = document.getElementById("query_display");
            display_elem.style.display = "block";
            display_elem.innerHTML = "<p>" + this.dumps() + "</p>";

            document.getElementById("error_banner").style.display="none";
        }
    }

    validate(){
        if(this.num_aggregates!=this.projected.length && this.num_aggregates>1){
            console.log(this.num_aggregates);
            return false;
        }
        
        return true;
    }
}

var query;

function compose_col_checkboxes(form){
    for(let i = 0;i<query.cols.length;i++){
        let col_name = query.cols[i];
        
        label = document.createElement("label");
        label.innerHTML = col_name;

        input = document.createElement("input");
        input.setAttribute("type", "checkbox");
        input.setAttribute("id", col_name);
        input.setAttribute("onchange", "handle_col_checkbox(event)");
        input.checked = true;
        
        
        br = document.createElement("br");
        
        form.appendChild(label);
        form.appendChild(input);
        form.appendChild(br);
    }
    submit = document.createElement("button");
    submit.setAttribute("onclick", "on_col_list_submit()");
    submit.setAttribute("type", "button");
    submit.innerHTML = "Next";
    form.appendChild(submit);
}

function compose_aggregate_radio(form){
    table = document.createElement("table");
    tr = document.createElement("tr");
    tr.innerHTML="<th>selected columns</th>";
    for(let agg of aggregates){
        tr.innerHTML += "<th>" + agg + "</th>";
    }
    table.appendChild(tr);

    for(let i=0;i<query.projected.length;i++){
        col_name = query.projected[i];
        tr = document.createElement("tr");
        tr.innerHTML = "<td>" + col_name + "</td>";

        for(let agg of aggregates){
            td = document.createElement("td");
            
            radio = document.createElement("input");
            radio.setAttribute("type", "radio");
            radio.setAttribute("name", col_name);
            radio.setAttribute("value", agg);
            radio.setAttribute("onclick", "handle_agg_radio(event)");
            
            td.appendChild(radio);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }   
    form.appendChild(table);
    // submit = document.createElement("button");
    // submit.setAttribute("onclick", "onAggSubmit()");
    // submit.setAttribute("type", "button");
    // submit.innerHTML = "Next";
    // form.appendChild(submit);
}

function compose_page(){
    query = new Query();
    //column form
    form = document.createElement("form");
    form.setAttribute("id", "col_form_display");
    compose_col_checkboxes(form);
    console.log(form.innerHTML);
    document.body.appendChild(form);
    
    //aggregate form
    form = document.createElement("form");
    form.setAttribute("id", "agg_form_display");
    form.style.display="none";
    document.body.appendChild(form);

    //query display    
    query_display = document.createElement("div");
    query_display.setAttribute("id", "query_display");
    document.body.appendChild(query_display);
}

function handle_col_checkbox(event){
    elem = event.target;
    if(!elem.checked) query.remove_project(elem.getAttribute("id"));
    else query.add_project(elem.getAttribute("id"));
    query.display();
}

function handle_agg_radio(event){
    elem = event.target;
    let col_name = elem.name;
    let agg = elem.value;
    query.add_aggregate(agg, col_name);
    console.log(query.projected);
    query.display();
}

function on_col_list_submit(){
    query.display();
    document.getElementById("col_form_display").style.display="none";
    
    form = document.getElementById("agg_form_display");
    form.style.display="block";
    compose_aggregate_radio(form);
    console.log(form.innerHTML);

    return false;  
}