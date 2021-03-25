<script>
	import data from './input1.json';

	const trace1 = {
		x: data.map(o => o.coords[0]),
		y: data.map(o => o.coords[1]),
		z: data.map(o => o.coords[2]),
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
		text: [...data.map(o => o.label)],
		hovertemplate: '%{text}<extra></extra>',
		showlegend: false
	};

	const layout = {margin: {
			l: 0,
			r: 0,
			b: 0,
			t: 0
		}};

	let canvas;

	const initializeViz = () => {
		Plotly.newPlot(canvas, [trace1], layout);
	}
</script>

<svelte:head>
	<script src="https://cdn.plot.ly/plotly-latest.min.js" on:load={initializeViz}></script>
</svelte:head>

<main>
	<h1>Hello!</h1>
	<div class="container">
		<table>
			<tr>
				<th>Label</th>
				<th>Sentence</th>
			</tr>
			{#each data as point}
				<tr>
					<td>{point.label}</td>
					<td>{point.legend}</td>
				</tr>
			{/each}
		</table>
		<div class="viz" bind:this={canvas}></div>
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

	tr:hover td {
		background-color: red;
	}
</style>