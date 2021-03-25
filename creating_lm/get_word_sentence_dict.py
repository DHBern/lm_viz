#! /usr/bin/python3

import json
import sys

def main(wordfile, sentencefile, outfile):
    """
    Generate a dict with words as keys and
    all sentences those words appear in as value
    """
    outdict = {}
    with open(wordfile, encoding="utf8") as wordf:
        for word in wordf:
            word = word.rstrip()
            outdict[word] = []
    with open(sentencefile, encoding="utf8") as sentf:
        for sent in sentf:
            sent = sent.rstrip()
            for word in outdict:
                if word in sent.split():
                    outdict[word].append(sent)
    with open(outfile, mode="w", encoding="utf8") as outf:
        json.dump(outdict, outf, indent=4)


if __name__ == "__main__":
    wordfile = sys.argv[1]
    sentencefile = sys.argv[2]
    outfile = sys.argv[3]
    main(wordfile, sentencefile, outfile)
