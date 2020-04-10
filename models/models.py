import csv

def loadFile(filename):
    with open(filename, "r") as f:
        reader = csv.reader(f, quotechar='"', delimiter=',')
        
        for i, line in enumerate(reader):
            print(i, line)
        