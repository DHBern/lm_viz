from flair.embeddings import FlairEmbeddings
from flair.data import Sentence
import sqlite3
import numpy as np

DBPATH = 'woerter.db'

'''
        returns a dictionary (key: Token, value: PyTorch tensor) of the sentence or just of a word of the sentence 
        embedded in a FlairEmbeddings using the given language model.
        
        :param wordID: ID of the word, which is fetched with its context from the DB
        :param pathLanguageModel: string containing the path to the used language model
        :param windowSize: if needed, the word will be embedded in a window with the 
            given size (odd numbers are better than even ones ;)), default: None = Whole sentence is taken as Context
'''
def get_vector_by_ID(wordID: int,
               pathLanguageModel,
               windowSize: int=None
             ):
    if wordID is None:
        raise ValueError('wordID is None')
        
    connection = sqlite3.connect(DBPATH)
    cursor = connection.cursor()
    
    if windowSize is None:
        sentenceID = cursor.execute('SELECT sentenceID FROM woerter WHERE wordID= ?', (wordID,)).fetchall()[0]
        sentence = dict(cursor.execute('SELECT wordID, word FROM woerter WHERE sentenceID= ?', (sentenceID[0],)).fetchall())
    else:
        start = wordID - np.floor(windowSize/2)
        print(start)
        sentence = dict(cursor.execute('SELECT wordID, word FROM woerter WHERE wordID BETWEEN ? AND ?', (start, start+windowSize-1,)).fetchall())
        print(sentence)
    
    sentence_str = " ".join(list(sentence.values()))
    # sentence_keys = list(sentence.keys())
    
    flairEmbedding = FlairEmbeddings(pathLanguageModel) # Flair does the path and type checking...
    toEmbed = Sentence(sentence_str)
    flairEmbedding.embed(toEmbed)
    result = {}
    # i = 0
    for token in toEmbed:
        result[token.text] = token.embedding # Key = Word
        # or: result[sentence_keys[i]] = token.embedding # Key = WordID
        # i++
    return result
    
'''
        returns a dictionary (key: Token, value: PyTorch tensor) of the sentence or just of a word of the sentence 
        embedded in a FlairEmbeddings using the given language model.
        
        :param word: word, which is searched in the DB -> all results are returned
        :param pathLanguageModel: string containing the path to the used language model
        :param windowSize: if needed, the word will be embedded in a window with the 
            given size (odd numbers are better than even ones ;)), default: None = Whole sentence is taken as Context
'''
def get_vector_by_word(word: str,
               pathLanguageModel,
               windowSize: int=None
             ):
    if word is None:
        raise ValueError('word is None')
    
    connection = sqlite3.connect(DBPATH)
    cursor = connection.cursor()
    
    words = cursor.execute('SELECT wordID FROM woerter WHERE word = ?', (word,)).fetchall()
    results = []
    
    for wordID in words:
        results.append(get_vector_by_ID(wordID[0], pathLanguageModel, windowSize))
    return results