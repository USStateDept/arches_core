import os

def WriteToFile(fileName, contents, mode = 'w'):
    ensure_dir(fileName)
    file = open(fileName, mode)
    file.write(contents)
    file.close()

def ensure_dir(f):
    d = os.path.dirname(f)
    if not os.path.exists(d):
        os.makedirs(d)

def arches_version():
    import os
    import subprocess
    from StringIO import StringIO
    import archesproject.settings as settings

    sb = StringIO()
    ver = ''
    try:
        hg_archival = open(os.path.join(settings.ROOT_DIR.replace('archesproject', ''),'.hg_archival.txt'),'r')
        the_file = hg_archival.readlines()
        hg_archival.close()
        node = ''
        latesttag = ''
        for line in the_file:
            if line.startswith('node:'):
                node = line.split(':')[1].strip()[:12]
            if line.startswith('latesttag:'):
                latesttag = line.split(':')[1].strip()

        ver = '%s.%s' % (latesttag, node)
        settings.ARCHES_VERSION = ver     
        sb.writelines(['__VERSION__="%s"' % ver])    
        WriteToFile(os.path.join(settings.ROOT_DIR,'version.py'), sb.getvalue(), 'w')
    except:
        try:
            ver = subprocess.check_output(['hg', 'log', '-r', '.', '--template', '{latesttag}.{node|short}'])
            settings.ARCHES_VERSION = ver     
            sb.writelines(['__VERSION__="%s"' % ver])
            WriteToFile(os.path.join(settings.ROOT_DIR,'version.py'), sb.getvalue(), 'w')
        except:
            ver = settings.ARCHES_VERSION
    return ver