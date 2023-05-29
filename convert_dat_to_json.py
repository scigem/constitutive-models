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

datfiles = glob.glob('data/**/**/*.dat')

ID0 = {
    'OE1' : '0.04-0.07',
    'OE2' : '0.04-0.07',
    'OE3' : '0.17-0.39',
    'OE4' : '0.17-0.39',
    'OE5' : '0.17-0.39',
    'OE6' : '0.17-0.39',
    'OE7' : '0.55-0.73',
    'OE8' : '0.55-0.73',
    'OE9' : '0.55-0.73',
    'OE10' : '0.55-0.73',
    'OE11' : '0.83-0.88',
    'OE12' : '0.83-0.88',
    'TMD1' : '0.15-0.25',
    'TMD2' : '0.15-0.25',
    'TMD3' : '0.15-0.25',
    'TMD4' : '0.15-0.25',
    'TMD5' : '0.15-0.25',
    'TMD6' : '0.46-0.55',
    'TMD7' : '0.46-0.55',
    'TMD8' : '0.46-0.55',
    'TMD9' : '0.46-0.55',
    'TMD10' : '0.46-0.55',
    'TMD11' : '0.57-0.68',
    'TMD12' : '0.57-0.68',
    'TMD13' : '0.57-0.68',
    'TMD14' : '0.57-0.68',
    'TMD15' : '0.57-0.68',
    'TMD16' : '0.79-0.85',
    'TMD17' : '0.79-0.85',
    'TMD18' : '0.79-0.85',
    'TMD19' : '0.79-0.85',
    'TMD20' : '0.79-0.85',
    'TMD21' : '0.85-0.95',
    'TMD22' : '0.85-0.95',
    'TMD23' : '0.85-0.95',
    'TMD24' : '0.85-0.95',
    'TMD25' : '0.85-0.95'
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
    this_ID = ID0[test].split('-')

    this_dict = {'ID0' : { 'min' : this_ID[0], 'max': this_ID[1]}, 'doi': publication_doi_link}
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