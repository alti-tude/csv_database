from flask import Flask, render_template, request, redirect, url_for
import json, os

import models

app = Flask(__name__, template_folder="views", static_folder="static")
app.config["UPLOAD_FOLDER"] = "uploads"

@app.route("/", methods=["GET","POST"])
def main():
    if 'file' not in request.files or request.files["file"].filename=='':
        return """
            <title>Upload new File</title>
                <h1>Upload new File</h1>
                <form method=post enctype=multipart/form-data>
                    <input type=file name=file>
                    <input type=submit value=Upload>
            </form>
        """
    else:
        return redirect(url_for('query'), code=307)


@app.route('/query', methods=["GET","POST"])
def query():
    file = request.files["file"]
    if file.filename.split(".")[-1]!="csv": 
        return redirect("/")

    filename = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(filename)
    
    models.loadFile(filename)

    with open(filename, "r") as f:
        headings = f.readline().split(",")
        
    return render_template("index.html", display_data=json.dumps(headings))


if __name__ == "__main__":
    app.run(debug=True)