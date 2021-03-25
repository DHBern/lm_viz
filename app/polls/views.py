from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
import plotly.graph_objects as go
# Create your views here.

def index(request):
  fig = go.Figure()
  fig.add_trace(go.Scatter(y=[2, 1, 4, 3]))
  fig.add_trace(go.Bar(y=[1, 4, 3, 2]))
  fig.update_layout(title = 'Hello Figure')
  graph = fig.to_html('/content/drive/test.html', full_html=False, default_height=500, default_width=700)
  context = {
    'user_input':'Hi',
    'plot': graph
  }
  return render(request, 'polls/index.html', context)

def detail(request, user_input):
  template = loader.get_template('polls/index.html')
  response = 'You called a user input: {}'.format(user_input)
  context = {
    'user_input': response
  }
  return HttpResponse(template.render(context, request))