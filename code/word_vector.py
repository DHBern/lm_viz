from flair.embeddings import FlairEmbeddings, StackedEmbeddings
from flair.data import Sentence
import sqlite3
import numpy as np
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
import json
import torch

class Vectorizer(object):
    
    def __init__(
        self,
        pathDB: str,
        pathLanguageModel,
        pathJSONfile: str = None # None => Returns Str
    ):
        self.pathDB = pathDB
        self.pathLanguageModel = pathLanguageModel
        self.pathJSONfile = pathJSONfile
        if type(pathLanguageModel) is str:
            self.flairEmbedding = FlairEmbeddings(pathLanguageModel) # Flair does the path and type checking...
        elif type(pathLanguageModel) is list:
            embs = []
            for lm in pathLanguageModel:
                flemb = FlairEmbeddings(str(lm))
                embs.append(flemb)
            self.flairEmbedding = StackedEmbeddings(embeddings=embs)
        else:
            raise ValueError('pathLanuageModel is not String or List')
        
    '''
            returns a array with all the sentences, containing the asked word
            [[word: str, sentence: str, vector: tensor]] embedded in a FlairEmbeddings using the given language model.

            :param wordID: ID of the word, which is fetched with its context from the DB
            :param windowSize: if needed, the word will be embedded in a window with the 
                given size (odd numbers are better than even ones ;)),
                default: None => Whole sentence is taken as Context
    '''
    def get_vector_by_ID(
        self,
        wordID: int, 
        windowSize: int = None
    ):
        if wordID is None:
            raise ValueError('wordID is None')

        connection = sqlite3.connect(self.pathDB)
        cursor = connection.cursor()

        if windowSize is None:
            sentenceID = cursor.execute('SELECT sentence FROM dhViz_sentenceentry WHERE id= ?', (wordID,)).fetchall()[0]
            sentence = dict(cursor.execute('SELECT id, word FROM dhViz_sentenceentry WHERE sentence= ?', (sentenceID[0],)).fetchall())
        else:
            start = wordID - np.floor(windowSize/2)
            print(start)
            sentence = dict(cursor.execute('SELECT id, word FROM dhViz_sentenceentry WHERE id BETWEEN ? AND ?', (start, start+windowSize-1,)).fetchall())
            print(sentence)

        sentence_str = " ".join(list(sentence.values()))
        word = sentence[wordID]
        
        toEmbed = Sentence(sentence_str)
        self.flairEmbedding.embed(toEmbed)
        result = [word, sentence_str]

        for token in toEmbed:
            if token.text == word:
                result.append(token.embedding)
                
        connection.close()
        return result

    '''
            returns a dictionary (key: Token, value: PyTorch tensor) of the sentence or just of a word of the sentence 
            embedded in a FlairEmbeddings using the given language model.

            :param word: word, which is searched in the DB -> all results are returned
            :param windowSize: if needed, the word will be embedded in a window with the 
                given size (odd numbers are better than even ones ;)), 
                default: None => Whole sentence is taken as Context
    '''
    def get_vector_by_word(self, word: str, windowSize: int = None):
        if word is None:
            raise ValueError('word is None')
        
        connection = sqlite3.connect(self.pathDB)
        cursor = connection.cursor()

        words = cursor.execute('SELECT id FROM dhViz_sentenceentry WHERE word = ?', (word,)).fetchall()
        results = []
        
        connection.close()
            
        for i, wordID in enumerate(words):
            vec = self.get_vector_by_ID(wordID[0], windowSize)
            vec[0] = vec[0]+str(i)
            results.append(vec)
            
        return results

    def dimension_reduction_pca(
        self,
        word_vectors,
        dims: int = 3,
        random_state: int = 42
    ):
        word_vectors_np = []
        for w in word_vectors:
            word_vectors_np.append(w.detach().cpu().numpy())
        return PCA(random_state=random_state).fit_transform(np.array(word_vectors_np))[:,:dims]
    
    def dimension_reduction_tsne(
        self,
        word_vectors,
        dims: int = 3, 
        random_state: int = 42,
        perplexity: int = 5,
        learning_rate: int = 500,
        n_iter: int = 10000
    ):
        word_vectors_np = []
        for w in word_vectors:
            word_vectors_np.append(w.detach().cpu().numpy())
        return TSNE(n_components = dims,
                    random_state = 0,
                    perplexity = perplexity,
                    learning_rate = learning_rate,
                    n_iter = n_iter
                   ).fit_transform(np.array(word_vectors_np))
    
    def get_json(
        self,
        wordToVisualize: str, 
        windowSize: int = None, 
        reduction_type: str = 'pca',
        dims: int = 3,
        random_state: int = 42,
        perplexity: int = 5,
        learning_rate: int = 500,
        n_iter: int = 10000
    ):
        results = self.get_vector_by_word(wordToVisualize, windowSize)
        json_data = []
        word_vecs = []
        reduced_vec = []
        results = results[:10]
        for r in results:
                word_vecs.append(r[2])
                
        if reduction_type.lower() == 'pca':
            reduced_vec = self.dimension_reduction_pca(word_vecs, dims, random_state)

        elif reduction_type.lower() == 'tsne':
            reduced_vec = self.dimension_reduction_tsne(
                word_vecs, 
                dims, 
                random_state,
                perplexity,
                learning_rate,
                n_iter
            )
        else:
            raise ValueError('"reduction_type" is not "pca" or "tsme".')
        for elem in zip(reduced_vec, results):
            json_item = { 
                "Label": str(elem[1][0]),
                "Legend": str(elem[1][1]),
                "Coords": elem[0].tolist()
                        }
            json_data.append(json_item)
        
        if self.pathJSONfile is not None:
            with open(self.pathJSONfile, "w") as write_file:
                json.dump(json_data, write_file, indent=4)
        
        return json_data
