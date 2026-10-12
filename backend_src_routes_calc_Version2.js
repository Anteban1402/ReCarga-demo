const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Calculadora simple: recibe ingresos, distancia_km, consumo_litros_por_100km, precio_gasolina, peajes, otros_costos
const schema = Joi.object({
  ingresos: Joi.number().required(),
  distancia_km: Joi.number().required(),
  consumo_l_100km: Joi.number().required(),
  precio_gasolina_por_litro: Joi.number().required(),
  peajes: Joi.number().optional().default(0),
  otros_costos: Joi.number().optional().default(0)
});

router.post('/', (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { ingresos, distancia_km, consumo_l_100km, precio_gasolina_por_litro, peajes, otros_costos } = value;

  const litros_consumidos = (consumo_l_100km / 100) * distancia_km;
  const costo_combustible = litros_consumidos * precio_gasolina_por_litro;
  const costos_totales = costo_combustible + peajes + otros_costos;
  const utilidad_estimada = ingresos - costos_totales;
  const margen_porcentaje = ingresos > 0 ? (utilidad_estimada / ingresos) * 100 : 0;

  res.json({
    supuestos: {
      litros_consumidos,
      costo_combustible,
      peajes,
      otros_costos
    },
    resultado: {
      ingresos,
      costos_totales,
      utilidad_estimada,
      margen_porcentaje
    }
  });
});

module.exports = router;