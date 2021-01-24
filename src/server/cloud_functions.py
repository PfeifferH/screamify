import requests

def sendRequest(event, context):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    file = event
    print(f"Processing file: {file['name']}.")

    filename = file['name']

    url = 'http://34.123.136.112:5000'
    myobj = {'filename': filename}

    x = requests.post(url, data = myobj)

    print(x.text)