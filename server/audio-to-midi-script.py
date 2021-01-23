#!C:\Python38\python.exe
# EASY-INSTALL-ENTRY-SCRIPT: 'audio-to-midi==2020.7','console_scripts','audio-to-midi'
__requires__ = 'audio-to-midi==2020.7'
import re
import sys
from pkg_resources import load_entry_point

if __name__ == '__main__':
    sys.argv[0] = re.sub(r'(-script\.pyw?|\.exe)?$', '', sys.argv[0])
    sys.exit(
        load_entry_point('audio-to-midi==2020.7', 'console_scripts', 'audio-to-midi')()
    )
