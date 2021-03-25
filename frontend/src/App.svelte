<script>
	import data1 from './json1.json';
	import data2 from './json2.json';
	import data3 from './json3.json';

	let canvas = [];
	let selectedItem = "";

	const data = [data1, data2, data3]; // create data Object from JSONs

	const traceOptions = { //static Option for each trace
		marker: {
			size: 12,
			line: {
				color: 'rgba(217, 217, 217, 0.14)',
				width: 0.5
			},
			opacity: 0.8
		},
		mode: 'markers',
		type: 'scatter3d',
		hovertemplate: '%{text}<extra></extra>',
		showLegend: false
	}

	const createTrace = (points, name, options) => { //create a trace from point-data
		return {
			x: points.map(o => o.Coords[0]),
			y: points.map(o => o.Coords[1]),
			z: points.map(o => o.Coords[2]),
			text: [...points.map(o => o.Label)],
			name: name,
			...options
		}
	}

	const traces = data.map((d,i) => createTrace(d, `Dataset ${i}`, traceOptions)); //create a trace for each dataset

	const layout = {
		hovermode:'closest',
		margin: {
			l: 0,
			r: 0,
			b: 0,
			t: 0
		}
	};

	const initializeViz = () => { //initialization method
		traces.forEach((trace, index) => {
			Plotly.newPlot(canvas[index], [trace], layout, {showSendToCloud: true});
			canvas[index].on('plotly_hover', vizHover);
			canvas[index].on('plotly_unhover', () => selectedItem = "");
		})
	}

	function vizHover(event) {
		if (selectedItem !== event.points[0].text){
			selectedItem = event.points[0].text;
		}
	}

	const selectPoint = (point, canvasRef, dataRef) => {
		let index = dataRef.map(o => o.Label).indexOf(point);
		let colorArray = new Array(dataRef.length).fill("grey");
		colorArray[index] = "red";
		Plotly.restyle(canvasRef, 'marker.color', [colorArray]);
	}

	const deselectPoint = (point, canvasRef, dataRef) => {
		let colorArray = new Array(dataRef.length).fill('blue');
		Plotly.restyle(canvasRef, 'marker.color', [colorArray]);
	}

</script>

<svelte:head>
	<script src="https://cdn.plot.ly/plotly-latest.min.js" on:load={initializeViz}></script>
</svelte:head>

<main>
	<h1>Visualizing Language Models</h1>
	<p>Language models (e.g. character embeddings) are essential to succeed in NLP tasks. Especially when it comes to Part-of-Speech and Named Entity Recognition, tasks result in more precise models if supported by adequate language models already. Since the advent of word2vec and large transformer-based language models (such as BERT or GPT-3) a variety of specialized and fine-tuned language models is currently available. Despite the widespread use and the necessity when it comes to specific model training (e.g. for language entities with only sparse data), our understanding of the models themselves is limited at best. In order to strengthen our understanding of language models and to start the process of reflecting them, this challenge asks for creative ways of visualizing language models. We envision 3D-visualizations based on dimension reduction to identify the positioning of e.g. synonym/homonyms in vector spaces or listing of semantic fields (neighboring vector values). For context insensitive approaches (e.g. word2vec or GloVe) we imagine to use the fixed vectors and represent calculations in grids.</p>
	{#each data as dataset, index}
		<div class="container">
			<table>
				<tr>
					<th>Label</th>
					<th>Sentence</th>
				</tr>
				{#each dataset as point (point.Label)}
					<tr id="{point.Label}" class:selected={point.Label === selectedItem} on:mouseenter={() => selectPoint(point.Label, canvas[index], dataset)} on:mouseleave={() => deselectPoint(point.Label, canvas[index], dataset)}>
						<td>{point.Label}</td>
						<td>{point.Legend}</td>
					</tr>
				{/each}
			</table>
			<div id="{`viz${index}`}" class="viz" bind:this={canvas[index]}></div>
		</div>
	{/each}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	.container {
		display: grid;
		grid-template-columns: 1fr 2fr;
		height: 100%;
		min-height: 600px;
	}

	tr:hover td, .selected {
		background-color: red;
	}
</style>