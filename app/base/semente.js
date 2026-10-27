/* Gerado por ferramentas/gerar-semente.mjs — não edite à mão.
   Cadastro inicial de demonstração: 3 clientes, 9 equipamentos. */
window.SEMENTE = {
 "clientes": [
  {
   "id": "hospex",
   "nome": "Hospital Exemplo",
   "cnpj": "00.000.000/0001-00",
   "endereco": "Rua Exemplo, 100 · Bairro Exemplo",
   "cidade": "Cidade Exemplo/UF",
   "cep": "00000-000",
   "telefone": "(00) 0000-0000",
   "rt": "Responsável Técnico Exemplo — CRM/UF 000.000",
   "alvara": "Alvará sanitário 0000/000000"
  },
  {
   "id": "clinex",
   "nome": "Clínica Exemplo",
   "cnpj": "00.000.000/0002-00",
   "endereco": "Avenida Exemplo, 200 · Bairro Exemplo",
   "cidade": "Cidade Exemplo/UF",
   "cep": "00000-000",
   "telefone": "(00) 0000-0000",
   "rt": "Responsável Técnico Exemplo — CRM/UF 000.000",
   "alvara": "Alvará sanitário 0000/000000"
  },
  {
   "id": "upaex",
   "nome": "UPA Exemplo",
   "cnpj": "00.000.000/0003-00",
   "endereco": "Praça Exemplo, 300 · Bairro Exemplo",
   "cidade": "Cidade Exemplo/UF",
   "cep": "00000-000",
   "telefone": "(00) 0000-0000",
   "rt": "Responsável Técnico Exemplo — CRM/UF 000.000",
   "alvara": "Alvará sanitário 0000/000000"
  }
 ],
 "equipamentos": [
  {
   "cliente": "hospex",
   "modalidade": 90,
   "id": "RX-01",
   "relatorio": "2026/0118",
   "periodicidade": "Anual",
   "visita": "",
   "validade": "",
   "unidade": "Unidade Exemplo I",
   "setor": "Radiologia",
   "sala": "Sala 2 · radiologia geral",
   "marca": "Siemens",
   "modelo": "Multix Fusion",
   "ns": "SN 48219",
   "patrimonio": "041182",
   "extra": {
    "tuboModelo": "Opti 150/30/50C",
    "tuboNs": "SN T-9921",
    "anoFab": "2019",
    "kvpMax": 150,
    "maMax": 500,
    "gerador": "alta",
    "tecnologia": "DR",
    "tipo": "Fixo",
    "filtracao": "2,5 mm Al (inerente) + 1,0 mm Al (adicional)"
   }
  },
  {
   "cliente": "clinex",
   "modalidade": 90,
   "id": "RX-02",
   "relatorio": "2026/0124",
   "periodicidade": "Anual",
   "visita": "",
   "validade": "",
   "unidade": "Unidade Exemplo II",
   "setor": "Radiologia",
   "sala": "Sala 1 · radiologia geral",
   "marca": "GE",
   "modelo": "Discovery XR656",
   "ns": "SN 77341",
   "patrimonio": "027744",
   "extra": {
    "tuboModelo": "Maxiray 100",
    "tuboNs": "SN T-4410",
    "anoFab": "2021",
    "kvpMax": 150,
    "maMax": 630,
    "gerador": "alta",
    "tecnologia": "DR",
    "tipo": "Fixo",
    "filtracao": "2,5 mm Al (inerente) + 1,0 mm Al (adicional)"
   }
  },
  {
   "cliente": "upaex",
   "modalidade": 90,
   "id": "RX-03",
   "relatorio": "2026/0131",
   "periodicidade": "Anual",
   "visita": "",
   "validade": "",
   "unidade": "Unidade Exemplo III",
   "setor": "Radiologia",
   "sala": "Sala única · urgência",
   "marca": "Philips",
   "modelo": "DigitalDiagnost",
   "ns": "SN 10925",
   "patrimonio": "A definir",
   "extra": {
    "tuboModelo": "SRO 33100",
    "tuboNs": "SN T-1877",
    "anoFab": "2014",
    "kvpMax": 125,
    "maMax": 400,
    "gerador": "alta",
    "tecnologia": "CR",
    "tipo": "Fixo",
    "filtracao": "2,5 mm Al (inerente)"
   }
  },
  {
   "cliente": "hospex",
   "modalidade": 95,
   "id": "ODI-01",
   "relatorio": "2026/0142",
   "periodicidade": "Bienal",
   "visita": "",
   "validade": "",
   "unidade": "Unidade Exemplo I",
   "setor": "Odontologia",
   "sala": "Consultório 3 · periapical",
   "marca": "Dabi Atlante",
   "modelo": "Spectro 70X Eletronic",
   "ns": "SN 70X-3318",
   "patrimonio": "052914",
   "extra": {
    "tuboModelo": "Toshiba D-041",
    "tuboNs": "SN T-2277",
    "anoFab": "2021",
    "kvpMax": 70,
    "maMax": 8,
    "tecnologia": "Digital · sensor",
    "tipo": "Parede",
    "localizador": "Cilindro longo 30 cm",
    "filtracao": "2,5 mm Al (total)"
   }
  },
  {
   "cliente": "clinex",
   "modalidade": 95,
   "id": "ODI-02",
   "relatorio": "2026/0147",
   "periodicidade": "Bienal",
   "visita": "",
   "validade": "",
   "unidade": "Unidade Exemplo II",
   "setor": "Odontologia",
   "sala": "Consultório 1 · periapical",
   "marca": "Gnatus",
   "modelo": "Timex 70E",
   "ns": "SN TX-8840",
   "patrimonio": "031277",
   "extra": {
    "tuboModelo": "Toshiba D-042B",
    "tuboNs": "SN T-6104",
    "anoFab": "2018",
    "kvpMax": 70,
    "maMax": 7,
    "tecnologia": "Digital · placa",
    "tipo": "Parede",
    "localizador": "Cilindro longo 30 cm",
    "filtracao": "2,0 mm Al (total)"
   }
  },
  {
   "cliente": "upaex",
   "modalidade": 95,
   "id": "ODI-03",
   "relatorio": "2026/0153",
   "periodicidade": "Bienal",
   "visita": "",
   "validade": "",
   "unidade": "Unidade Exemplo III",
   "setor": "Odontologia",
   "sala": "Consultório único · urgência",
   "marca": "Procion",
   "modelo": "Rx Plus 60",
   "ns": "SN PR-1192",
   "patrimonio": "A definir",
   "extra": {
    "tuboModelo": "Kailong KL-60",
    "tuboNs": "SN T-0455",
    "anoFab": "2009",
    "kvpMax": 60,
    "maMax": 7,
    "tecnologia": "Filme",
    "tipo": "Parede",
    "localizador": "Cone curto 20 cm",
    "filtracao": "1,5 mm Al (total)"
   }
  },
  {
   "cliente": "hospex",
   "modalidade": 96,
   "id": "US-0614",
   "relatorio": "2026/0471",
   "periodicidade": "Anual",
   "visita": "20/07/2026",
   "validade": "19/07/2027",
   "unidade": "Unidade Exemplo I",
   "marca": "Philips",
   "modelo": "Affiniti 70G",
   "ns": "US216F0721",
   "patrimonio": "—",
   "setor": "Ultrassom",
   "sala": "Diagnóstico por imagem",
   "extra": {
    "transdutores": [
     {
      "slot": "T1",
      "tipo": "Linear",
      "modelo": "L12-3",
      "ns": "21F07PHN",
      "cod": "US-5836",
      "fmax": 12,
      "tec": {
       "protocolo": "Vasc Carótida",
       "potencia": "-0,5 dB",
       "ad": "61",
       "profmax": "10 cm",
       "rejeicao": "0",
       "graymap": "3",
       "bandafocal": "0",
       "densidade": "2"
      }
     },
     {
      "slot": "T2",
      "tipo": "Linear",
      "modelo": "L12-5",
      "ns": "21F0BXHZ",
      "cod": "US-6324",
      "fmax": 12,
      "tec": {
       "protocolo": "Vasc Carótida",
       "potencia": "—",
       "ad": "56",
       "profmax": "8 cm",
       "rejeicao": "0",
       "graymap": "2",
       "bandafocal": "0",
       "densidade": "2"
      }
     },
     {
      "slot": "T3",
      "tipo": "Convexo",
      "modelo": "C5-1",
      "ns": "21F0DQPK",
      "cod": "US-7131",
      "fmax": 4,
      "tec": {
       "protocolo": "Abdome geral",
       "potencia": "—",
       "ad": "60",
       "profmax": "16 cm",
       "rejeicao": "0",
       "graymap": "3",
       "bandafocal": "2",
       "densidade": "3"
      }
     }
    ],
    "medidas": {}
   }
  },
  {
   "cliente": "clinex",
   "modalidade": 96,
   "id": "US-0378",
   "relatorio": "2026/0403",
   "periodicidade": "Anual",
   "visita": "01/07/2026",
   "validade": "30/06/2027",
   "unidade": "Unidade Exemplo II",
   "marca": "GE",
   "modelo": "LOGIQ E9",
   "ns": "LE9117690US8",
   "patrimonio": "051979",
   "setor": "Ultrassom",
   "sala": "Hemodinâmica",
   "extra": {
    "transdutores": [
     {
      "slot": "T1",
      "tipo": "Linear",
      "modelo": "9L-D",
      "ns": "216589WP2",
      "cod": "US-0356-L1",
      "fmax": 9,
      "tec": {
       "protocolo": "Carótida",
       "potencia": "100",
       "ad": "72",
       "profmax": "20 cm",
       "rejeicao": "0",
       "graymap": "H",
       "bandafocal": "0",
       "densidade": "2"
      }
     },
     {
      "slot": "T2",
      "tipo": "Linear",
      "modelo": "ML6-15-D",
      "ns": "115480YP6",
      "cod": "US-0378-L2",
      "fmax": 15,
      "tec": {
       "protocolo": "Carótida",
       "potencia": "100",
       "ad": "72",
       "profmax": "12 cm",
       "rejeicao": "0",
       "graymap": "H",
       "bandafocal": "2",
       "densidade": "1"
      }
     },
     {
      "slot": "T3",
      "tipo": "Convexo",
      "modelo": "C1-5-D",
      "ns": "121040YP0",
      "cod": "US-0356-C2",
      "fmax": 5,
      "tec": {
       "protocolo": "Abdome",
       "potencia": "100",
       "ad": "69",
       "profmax": "33 cm",
       "rejeicao": "0",
       "graymap": "G",
       "bandafocal": "2",
       "densidade": "3"
      }
     }
    ],
    "medidas": {}
   }
  },
  {
   "cliente": "upaex",
   "modalidade": 96,
   "id": "US-0912",
   "relatorio": "",
   "periodicidade": "Anual",
   "visita": "",
   "validade": "",
   "unidade": "Unidade Exemplo III",
   "marca": "Mindray",
   "modelo": "DC-40",
   "ns": "DC40D9922",
   "patrimonio": "062441",
   "setor": "Ultrassom",
   "sala": "Sala de procedimentos",
   "extra": {
    "semHistorico": true,
    "transdutores": [
     {
      "slot": "T1",
      "tipo": "Convexo",
      "modelo": "C5-2s",
      "ns": "D9922KX1",
      "cod": "US-0913",
      "fmax": 5,
      "tec": {
       "protocolo": "Abdome geral",
       "potencia": "—",
       "ad": "—",
       "profmax": "—",
       "rejeicao": "—",
       "graymap": "—",
       "bandafocal": "—",
       "densidade": "—"
      }
     },
     {
      "slot": "T2",
      "tipo": "Linear",
      "modelo": "L12-4s",
      "ns": "D9922KX2",
      "cod": "US-0914",
      "fmax": 12,
      "tec": {
       "protocolo": "Partes moles",
       "potencia": "—",
       "ad": "—",
       "profmax": "—",
       "rejeicao": "—",
       "graymap": "—",
       "bandafocal": "—",
       "densidade": "—"
      }
     }
    ],
    "medidas": {}
   }
  }
 ]
};
