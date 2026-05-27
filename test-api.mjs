// Usando fetch nativo do Node.js 18+
async function test() {
  console.log("Testando API Local: http://localhost:3000/api/oracle/read");
  try {
    const res = await fetch('http://localhost:3000/api/oracle/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tipoOraculo: 'Tarô', 
        tipoLeitura: 'sim_nao', 
        tema: 'Trabalho',
        pergunta: 'Vou conseguir a vaga?',
        cartas: ['O Mago']
      })
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Resposta:", text);
  } catch (err) {
    console.error("ERRO AO CHAMAR API:", err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error("DICA: O servidor (npm run dev) não parece estar rodando na porta 3000.");
    }
  }
}

test();
