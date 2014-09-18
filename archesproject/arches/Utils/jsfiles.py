import glob, os
from django.conf import settings
from django.utils.importlib import import_module

def JsFiles(debug=True):
    # Load order is important... scripts are loaded from top to bottom, file
    # references first, then all files in each directory in paths, skipping 
    # already loaded files from filepaths. Only retrieves scripts in immediate 
    # paths (doesn't load from child directories)

    filepaths = [
        'js/ui_frameworks/FGI-4.0/widgets/FGI-widgets-Login.js', 
        'js/ui_frameworks/FGI-4.0/widgets/FGI-widgets-Map.js', 
        'js/ui_frameworks/FGI-4.0/widgets/FGI-widgets-SideTabPanel.js', 
        'js/ui_frameworks/FGI-4.0/openlayers/FGI-openlayers-SimpleJSONFormat.js',
        'js/debug/config/URLs.js',
        'js/debug/forms/Arches.forms.AbstractForm.js',
        'js/debug/reports/Arches.reports.Default.js',
        'js/debug/reports/Arches.reportsection.BaseReportSection.js',
        'js/debug/reports/Arches.reportsection.BaseReportSectionGrid.js'
    ]
    paths = [
        'js/ui_frameworks/proj4js/lib/defs/',
        'js/debug/config/',
        'js/debug/controllers/',
        'js/debug/models/',
        'js/debug/widgets/',
        'js/debug/forms/',
        'js/debug/reports/',
        'js/debug/',
        'js/debug/components/'
    ]


    if debug:
        filepaths = [
            'js/ui_frameworks/OpenLayers-2.12/OpenLayers.debug.js',
            'js/ui_frameworks/ext-4.0.2a/ext-all-debug.js',
            'js/ui_frameworks/proj4js/lib/proj4js-combined.js'
        ] + filepaths
    else:
        filepaths = [   
            'js/ui_frameworks/OpenLayers-2.12/OpenLayers.debug.js',
            'js/ui_frameworks/ext-4.0.2a/ext-all.js',
            'js/ui_frameworks/proj4js/lib/proj4js-compressed.js'
        ] + filepaths

    
    ret = filepaths
    for path in paths:
        dir = os.path.dirname(os.path.join(settings.ROOT_DIR, 'arches', 'Media', path)) 
        os.chdir(dir)
        files = glob.glob("*.js")
        files.sort()
        for file in files:
            if not(path + file in filepaths):
                ret.append(path + file)

    for package_name in settings.INSTALLED_PACKAGES:
        jsfilesfile = os.path.join(settings.ROOT_DIR, 'packages', package_name, 'utils', 'jsfiles.py')
        if os.path.exists(jsfilesfile):
            mod = import_module("archesproject.packages.%s.utils.jsfiles" % package_name)
            if mod != None:
                ret += mod.JsFiles(debug=False)

    return ret