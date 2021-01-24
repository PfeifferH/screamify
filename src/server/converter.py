import os
import firebase_admin
from firebase_admin import credentials, firestore, storage

cred = credentials.Certificate("./screamify-63c29-firebase-adminsdk-tsw4n-95029ab277.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "screamify-63c29.appspot.com"
})
bucket = storage.bucket()
db = firestore.client()


from flask import Flask, request, redirect, url_for
app = Flask(__name__)

@app.route("/", methods=['GET', 'POST'])
def convert():
    #print("I AM HERE")
    
    args = request.form

    print(args)
    
    filename = args['filename']
    print(filename)

    rawFile = filename[6:]
    print(rawFile)

    #Download mp3/wav from audio
    #storage.child(filename).download(rawFile)
    blob = bucket.blob(filename)
    blob.download_to_filename("/tmp/"+rawFile)

    destFile = rawFile + ".mid"
    print(destFile)
    cmd = r"audio-to-midi " + "/tmp/" + rawFile + " -o /tmp/" + destFile
    print(cmd)

    os.system(cmd)
    
    blob = bucket.blob("songs/" + rawFile)
    blob.upload_from_filename("/tmp/" + destFile)
    blob.make_public()
    newUrl = blob.public_url
    # Upload /tmp/destFile to songs
    #storage.child("songs/" + destFile).put(destFile)
    
    #newUrl = storage.child(u"songs/" + destFile).get_url()
    
    doc = db.collection(u"audio").document(rawFile).get()
    data = None
    if doc.exists:
        data = doc.to_dict()
    else:
        print("The requested document does not exist")
        return "-1"

    name = data["name"]

    doc = db.collection(u"songs").document(rawFile).set({
      "name": name,
      "url": newUrl
    })

    print("Done")
    return "0"

#@app.route('/', methods=['GET', 'POST']) #allow both GET and POST requests
#def convert():
#    print("hello")
#    return "hello"


if __name__ == "__main__":
    app.debug = True
    app.run()