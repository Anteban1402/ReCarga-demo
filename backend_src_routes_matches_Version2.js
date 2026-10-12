const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Recomendar cargas compatibles para un vehículo (coincidencia sencilla: destino del offer coincide con origen de ruta_retorno o viceversa)
router.get('/for-vehicle/:vehicleId', async (req, res) => {
  const { vehicleId } = req.params;
  const { data: vehicle, error: vErr } = await supabase.from('vehicles').select('*').eq('id', vehicleId).single();
  if (vErr || !vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });

  // Heurística simple: si ruta_retorno contiene ciudad X, buscamos offers cuyo origen o destino coincida con X
  const ruta = vehicle.ruta_retorno || '';
  const tokens = ruta.split(/[-,\/]/).map(t => t.trim()).filter(Boolean);

  // Construir consulta: or ilike por tokens
  let query = supabase.from('offers').select('*').order('fecha', { ascending: true }).limit(100);
  if (tokens.length > 0) {
    // buscaremos offers donde destino o origen contenga alguno de los tokens
    tokens.forEach((tk, idx) => {
      if (idx === 0) {
        query = query.ilike('destino', `%${tk}%`).or(`origen.ilike.%${tk}%`);
      } else {
        // NOTE: supabase-js doesn't chain or easily; fallback a buscar todo y filtrar en JS
      }
    });
  }

  // Si la consulta anterior no es precisa por supabase-js limitations, hacemos consulta amplia y filtramos en JS
  const { data: offers, error: oErr } = await supabase.from('offers').select('*').limit(500);
  if (oErr) return res.status(500).json({ error: oErr.message });

  // Filtrar en memoria por tokens
  const matches = offers.filter(o => {
    const texto = `${o.origen} ${o.destino}`.toLowerCase();
    return tokens.some(tk => texto.includes(tk.toLowerCase()));
  }).slice(0, 50);

  res.json({
    vehicle,
    recommendations: matches
  });
});

module.exports = router;