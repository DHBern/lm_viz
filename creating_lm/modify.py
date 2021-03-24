#! /usr/bin/python3

"""
Prepare training data for new experiment.
python3 modify.py old_train.py <outfile_name>
"""

import pprint as pp
import re
import sys


class Processor(object):

    def __init__(
        self,
        infile: str, 
        trainfile: str,
        wordfile: str,
        split_signs: str = r" \.",  # is a regex expression!
        max_sent_length: int = 240,  # None => no limit, TODO: Make default the average sent length
        process_ssrq: bool = True  # Let's exclude ssrq data for the moment
    ):
        self.infile = infile
        self.trainfile = open(trainfile, mode="w", encoding="utf8")
        self.wordfile = open(wordfile, mode="w", encoding="utf8")
        self.split_signs = split_signs
        self.max_sent_length = max_sent_length
        self.process_ssrq = process_ssrq
        self.wordtypes = set()
        self.sentence_num = 0
        self.sentence_lengths = 0

    def process(self):
        with open(self.infile, encoding="utf8") as inf:
            for line in inf:
                self.process_line(line)
        self.trainfile.close()
        for wordtype in self.wordtypes:
            self.wordfile.write(wordtype + "\n")
        self.wordfile.close()
        
        #avg_sentence_len = self.sentence_lengths / self.sentence_num
        #pp.pprint(avg_sentence_len)
        

    def process_line(self, line):
        # check if line is ssrq (contains no periods)
        if not self.process_ssrq and not "." in line:
            return

        finished_sentences = []
        # split the line at all split_signs.
        sents = re.split(self.split_signs, line)
        for sent in sents:
            # Iterate the resulting sentences and check against max_sent_length
            # A) Split sentence into two halves at the next whitespace => Results in more equal sentence lengths
            # or B) Split after max_sent_length
            finished_sentences.extend(self.check_sent_length(sent))
        for sent in finished_sentences:
            #self.sentence_num += 1
            #self.sentence_lengths += len(sent)
            self.trainfile.write(sent + "\n")
            for token in sent.split():
                token = token.rstrip(",")
                self.wordtypes.add(token)

    def check_sent_length(self, sent):
        sent = sent.strip()
        if not sent:
            return []
        return_sents = []
        if self.max_sent_length != None and len(sent) > self.max_sent_length:
            position = int(len(sent)/2)
            while sent[position] != " ":
                position += 1
            sent1 = sent[:position]
            sent2 = sent[position:]
            return_sents.extend(self.check_sent_length(sent1))
            return_sents.extend(self.check_sent_length(sent2))
        else:
            return_sents.append(sent)
        return return_sents

        
def main():
    infile = sys.argv[1]
    outfile = sys.argv[2]
    wordfile = sys.argv[3]
    p = Processor(infile, outfile, wordfile)
    p.process()


if __name__ == "__main__":
    main()