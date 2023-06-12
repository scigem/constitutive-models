# import numpy as np
import pandas as pd
import glob
import json
import re

def replace_multiple_spaces_with_tab(text):
    pattern = r'([ ]+ )' # Matches one or more whitespace characters but not newlines
    replacement = '\t'  # Tab character

    modified_text = re.sub(pattern, replacement, text)
    modified_text = re.sub(r'\t+$', '', modified_text, flags=re.MULTILINE) # remove trailing tabs
    modified_text = re.sub(r'\t+', '\t', modified_text, flags=re.MULTILINE) # remove duplicate tabs

    return modified_text

datfiles = glob.glob('data/**/*.dat')

IC = {
    'OE1' : { 'ID0' : 0.04 },
    'OE2' : { 'ID0' : 0.07 },
    'OE3' : { 'ID0' : 0.17 },
    'OE4' : { 'ID0' : 0.22 },
    'OE5' : { 'ID0' : 0.28 },
    'OE6' : { 'ID0' : 0.39 },
    'OE7' : { 'ID0' : 0.55 },
    'OE8' : { 'ID0' : 0.59 },
    'OE9' : { 'ID0' : 0.65 },
    'OE10' : { 'ID0' : 0.73 },
    'OE11' : { 'ID0' : 0.83 },
    'OE12' : { 'ID0' : 0.88 },
    'TMD1' : { 'ID0' : 0.15, 'p0' : 50 },
    'TMD2' : { 'ID0' : 0.21, 'p0' : 100 },
    'TMD3' : { 'ID0' : 0.21, 'p0' : 200 },
    'TMD4' : { 'ID0' : 0.22, 'p0' : 300 },
    'TMD5' : { 'ID0' : 0.25, 'p0' : 400 },
    'TMD6' : { 'ID0' : 0.46, 'p0' : 50 },
    'TMD7' : { 'ID0' : 0.51, 'p0' : 100 },
    'TMD8' : { 'ID0' : 0.52, 'p0' : 200 },
    'TMD9' : { 'ID0' : 0.55, 'p0' : 300 },
    'TMD10' : { 'ID0' : 0.55, 'p0' : 400 },
    'TMD11' : { 'ID0' : 0.57, 'p0' : 50 },
    'TMD12' : { 'ID0' : 0.63, 'p0' : 100 },
    'TMD13' : { 'ID0' : 0.63, 'p0' : 200 },
    'TMD14' : { 'ID0' : 0.64, 'p0' : 300 },
    'TMD15' : { 'ID0' : 0.68, 'p0' : 400 },
    'TMD16' : { 'ID0' : 0.82, 'p0' : 50 },
    'TMD17' : { 'ID0' : 0.79, 'p0' : 100 },
    'TMD18' : { 'ID0' : 0.81, 'p0' : 200 },
    'TMD19' : { 'ID0' : 0.85, 'p0' : 300 },
    'TMD20' : { 'ID0' : 0.80, 'p0' : 400 },
    'TMD21' : { 'ID0' : 0.85, 'p0' : 50 },
    'TMD22' : { 'ID0' : 0.85, 'p0' : 100 },
    'TMD23' : { 'ID0' : 0.92, 'p0' : 200 },
    'TMD24' : { 'ID0' : 0.95, 'p0' : 300 },
    'TMD25' : { 'ID0' : 0.89, 'p0' : 400 },
}

publication_doi_link = 'https://doi.org/10.1007/s11440-015-0402-z'
all_data = {}

for f in datfiles:
    with open(f, 'r') as file:
        s = file.read()
        s = replace_multiple_spaces_with_tab(s)
    with open(f, 'w') as file:
        file.write(s)

    outname = f[:-4] + '.json'
    test = f.split('/')[-1][:-4]
    print(f'Converting test {test}: {f} to {outname}')
    
    data = pd.read_table(f, header = [0,1], skip_blank_lines=True, sep='\t')
    # print(data.head())
    # this_ID = ID0[test].split('-')

    this_dict = {'ID0' : IC[test]['ID0'], 'doi': publication_doi_link}
    if 'p0' in IC[test]: this_dict['p0'] = IC[test]['p0']
    
    for i in range(len(data.columns.values)):
        this_dict[data.columns.values[i][0]] = {}
        if data.columns.values[i][1] == '[kPa]':
            mag = 1000
        elif data.columns.values[i][1] == '[%]':
            mag = 0.01
        else:
            mag = 1
        this_dict[data.columns.values[i][0]]['data'] = (data[data.columns.values[i]]*mag).to_list()
        this_dict[data.columns.values[i][0]]['unit'] = 'SI'#data.columns.values[i][1]
    
    all_data[test] = this_dict
    # print(all_data)

json.dump(all_data, open('data/experimental_data.json', 'w'), indent=2)