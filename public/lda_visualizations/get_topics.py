import glob
topFiles = glob.glob('./*all-topics.txt')
import json
topicsByFname = {}
for fname in topFiles:
    text = open(fname).read()
    textspl = text.split(')')
    topicsByFname[fname] = []
    for line in textspl:
        try:
            topicsByFname[fname].append(line.split('+')[0].strip().split('*')[1])
        except:
            continue
with open('./topicsByFname.json','w') as f:
    f.write(json.dumps(topicsByFname))
        
