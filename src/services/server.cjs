const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5000;
const execPromise = promisify(exec);

app.use(cors());
app.use(express.json());

const locations = [
  { name: 'NewYork', location: 'verizon+new york' },
  { name: 'SanJose', location: 'san jose' },
  { name: 'CostaRica', location: 'Costa Rica' },
  { name: 'Panama', location: 'panama city' },
  { name: 'Ipatinga', location: 'ipatinga' },
  { name: 'BuenosAires', location: 'Buenos Aires' },
  { name: 'Madrid', location: 'Madrid' },
  { name: 'Barcelona', location: 'Barcelona' },
  { name: 'Melbourne', location: 'Melbourne' },
  { name: 'Sydney', location: 'Sydney' },
  { name: 'Johannesburg', location: 'Johannesburg' },
  { name: 'CapeTown', location: 'Cape Town' },
];



// Función para convertir la salida del traceroute a JSON
const parseTraceroute = (data) => {
  const lines = data.split('\n').filter(line => line.trim());
  const result = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 4) {
      result.push({
        hop: parseInt(parts[0], 10),
        name: parts[1] || null,
        ipv4: parts[2] || null,
        latency: parts.slice(3).join(' ') || null
      });
    }
  }
  return result;
};

app.post('/trace', async (req, res) => {
  const { target } = req.body;
  if (!target) return res.status(400).json({ error: 'Target is required' });

  try {
    // Crear carpeta si no existe
    await fs.mkdir('../data', { recursive: true });
    await fs.mkdir('../datajson', { recursive: true });

    // Ejecutar traceroute en todas las ubicaciones
    for (const { name, location } of locations) {
      console.log(`Tracing ${target} from ${location}...`);
      await execPromise(`globalping traceroute ${target} from "${location}" --limit 1 > ../data/${name}.txt`);
    }

    // Convertir resultados a JSON
    for (const { name } of locations) {
      const filePath = `../data/${name}.txt`;
      const jsonPath = `../datajson/${name}.json`;

      try {
        const data = await fs.readFile(filePath, 'utf8');
        const parsedData = parseTraceroute(data);
        await fs.writeFile(jsonPath, JSON.stringify(parsedData, null, 2));
      } catch (err) {
        console.error(`Error processing ${name}:`, err);
      }
    }

    res.json({ message: 'Tracing completed. JSON files saved in /datajson.' });
  } catch (error) {
    console.error('Error executing traceroute:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
