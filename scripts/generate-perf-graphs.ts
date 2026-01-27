import fs from 'fs';
import path from 'path';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 1200;
const height = 600;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

const perfDir = path.resolve('perf-results');
const outputDir = path.resolve('perf-graphs');

fs.mkdirSync(outputDir, { recursive: true });
console.log(`✅ Output directory ensured: ${outputDir}`);

console.log('Looking for perf-results at:', perfDir);
console.log('Exists?', fs.existsSync(perfDir));
console.log('Contents:', fs.existsSync(perfDir) ? fs.readdirSync(perfDir) : 'N/A');


// Check for JSON files
if (!fs.existsSync(perfDir)) {
  console.error(`❌ JSON directory does not exist: ${perfDir}`);
  process.exit(1);
}

const files = fs.readdirSync(perfDir).filter(f => f.endsWith('.json'));

if (files.length === 0) {
  console.error(`❌ No JSON files found in ${perfDir}. Run your tests first.`);
  process.exit(1);
}

console.log(`Found ${files.length} JSON file(s):`, files);

const data = files.map(file => {
  const jsonPath = path.join(perfDir, file);
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Processing ${file}: avgFps=${json.avgFps}, minFps=${json.minFps}`);
  return {
    url: json.url,
    avgFps: json.avgFps,
    minFps: json.minFps,
    loadEvent: json.loadEvent,
    domContentLoaded: json.domContentLoaded,
  };
});

const labels = data.map(d =>
  d.url.replace(/^https?:\/\//, '').split('/').slice(-1)[0]
);

async function renderChart(label: string, values: number[], fileName: string) {
  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: true },
        title: { display: true, text: label },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(config as any);
  const outPath = path.join(outputDir, fileName);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Graph written: ${outPath}`);
}

(async () => {
  try {
    await renderChart('Average FPS', data.map(d => d.avgFps), 'avg-fps.png');
    await renderChart('Minimum FPS', data.map(d => d.minFps), 'min-fps.png');
    await renderChart('Load Event (ms)', data.map(d => d.loadEvent), 'load-event.png');
    await renderChart('DOM Content Loaded (ms)', data.map(d => d.domContentLoaded), 'dom-content-loaded.png');
    console.log('🎉 All performance graphs generated successfully!');
  } catch (err) {
    console.error('❌ Failed to generate graphs:', err);
    process.exit(1);
  }
})();
