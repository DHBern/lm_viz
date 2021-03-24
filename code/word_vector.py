from flair.embeddings import FlairEmbeddings
from flair.data import Sentence   

'''
        returns a dictionary (key: Token, value: PyTorch tensor) of the sentence or just of a word of the sentence embedded in a FlairEmbeddings using the given language model.
        :param sentence: string of the sentence to embed
        :param pathLanguageModel: string containing the path to the used language model
        :param word: string of a word in the sentence, default: None
'''
def get_vector(sentence: str,
               pathLanguageModel,
               word: str=None
             ):
    if word is not None:
        word = word.strip()
    if word is not None and word not in sentence:
        raise ValueError('Word {} is not found in sentence {}'.format(word, sentence))
    flairEmbedding = FlairEmbeddings(pathLanguageModel) # Flair does the path and type checking...
    toEmbed = Sentence(sentence)
    flairEmbedding.embed(toEmbed)
    if word is None:
        result = {}
        for token in toEmbed:
            result[token] = token.embedding
        return result
    else:
        result = {}
        for token in toEmbed:
            if token.text == word:
                result[token] = token.embedding
        return result