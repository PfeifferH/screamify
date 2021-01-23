import os
import sys

#print(os.environ.get("PATH"))


def convertAudioToMidi(filename):

    cmd = r"audio-to-midi.exe " + filename
    success = os.system(cmd)

    if(success == 0 and os.path.exists(filename + ".mid")):
        return 0

    return 1

def main():

    filename = sys.argv[1]

    print("File: " + filename)
    result = convertAudioToMidi(filename)

    print(result)

main()

