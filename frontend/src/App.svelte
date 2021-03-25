<script>
	import { onMount } from 'svelte';
	import data from './test.json';

	const trace1 = {
		x: data.map(o => o.Coords[0]),
		y: data.map(o => o.Coords[1]),
		z: data.map(o => o.Coords[2]),
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
		name: 'Dataset 1',
		text: [...data.map(o => o.Label)],
		hovertemplate: '%{text}<extra></extra>',
		showLegend: false
	};

	const layout = {
		hovermode:'closest',
		margin: {
			l: 0,
			r: 0,
			b: 0,
			t: 0
		}
	};

	let canvas;
	let selectedItem = "";

	const initializeViz = () => {
		Plotly.newPlot(canvas, [trace1], layout, {showSendToCloud: true});
		canvas.on('plotly_hover', vizHover)
		canvas.on('plotly_unhover', vizUnhover)
	}

	function vizHover(event) {
		console.log(event)
		if (selectedItem !== event.points[0].text){
			selectedItem = event.points[0].text;
		}
	}

	function vizUnhover(event) {
		selectedItem = "";
	}

	const selectPoint = (point) => {
		let index = data.map(o => o.Label).indexOf(point);
		let colorArray = new Array(data.length).fill("grey");
		colorArray[index] = "red";
		Plotly.restyle('myDiv', 'marker.color', [colorArray]);
	}

	const deselectPoint = (point) => {
		let colorArray = new Array(data.length).fill('blue');
		Plotly.restyle('myDiv', 'marker.color', [colorArray]);
	}

</script>

<svelte:head>
	<script src="https://cdn.plot.ly/plotly-latest.min.js" on:load={initializeViz}></script>
</svelte:head>

<main>
	<h1>Visualizing Language Models</h1>
	<p>Language models (e.g. character embeddings) are essential to succeed in NLP tasks. Especially when it comes to Part-of-Speech and Named Entity Recognition, tasks result in more precise models if supported by adequate language models already. Since the advent of word2vec and large transformer-based language models (such as BERT or GPT-3) a variety of specialized and fine-tuned language models is currently available. Despite the widespread use and the necessity when it comes to specific model training (e.g. for language entities with only sparse data), our understanding of the models themselves is limited at best. In order to strengthen our understanding of language models and to start the process of reflecting them, this challenge asks for creative ways of visualizing language models. We envision 3D-visualizations based on dimension reduction to identify the positioning of e.g. synonym/homonyms in vector spaces or listing of semantic fields (neighboring vector values). For context insensitive approaches (e.g. word2vec or GloVe) we imagine to use the fixed vectors and represent calculations in grids.</p>
	<div class="container">
		<table>
			<tr>
				<th>Label</th>
				<th>Sentence</th>
			</tr>
			{#each data as point (point.Label)}
				<tr id="{point.Label}" class:selected={point.Label === selectedItem} on:mouseenter={() => selectPoint(point.Label)} on:mouseleave={() => deselectPoint(point.Label)}>
					<td>{point.Label}</td>
					<td>{point.Legend}</td>
				</tr>
			{/each}
		</table>
		<div id="myDiv" class="viz" bind:this={canvas}></div>
	</div>
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