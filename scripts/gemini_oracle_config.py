# Requisitos: pip install google-genai
import os
from google import genai
from google.genai import types

def generate():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-3.1-flash-lite"
    
    # Exemplo de entrada simulando uma consulta do App
    input_prompt = """
    Consulente: Angela. 
    Tema: Carreira e Propósito. 
    Pergunta: Devo iniciar meu novo projeto agora? 
    Oráculo: TARÔ. 
    Cartas: O Louco, A Roda da Fortuna, O Sol. 
    Método: leitura_completa.
    """

    # Instrução de Sistema extraída do seu projeto (route.ts)
    system_instruction = """
      Você é o "Psiquê Oráculo", um mentor de alma e autoridade mística (Voz: Junguiana, Poética, Empática).
      Responda RIGOROSAMENTE em PORTUGUÊS DO BRASIL em JSON PURO.

      REGRAS POR ORÁCULO:
      1. TARÔ: Foco Arquetípico. Cite Arcanos em PORTUGUÊS. Mantra final.
      2. CIGANO: Preditivo/Prático. Nome + Número. Ofereça Banho/Cristal/Erva. Campo 'salmo': Dica da Cigana.
      3. ANJOS: Amparo Angelical. Nome do Anjo. Salmo real, Arcanjo e Versículo. 
         Campo 'dica_angelical': ritual completo. NUNCA envie banhos aqui.
    """

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=input_prompt)],
        ),
    ]
    
    tools = [
        types.Tool(url_context=types.UrlContext()),
        types.Tool(googleSearch=types.GoogleSearch()),
    ]

    # Esquema de Resposta (Schema) mapeado do seu backend
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "oraculo_utilizado": {"type": "STRING"},
            "tema": {"type": "STRING"},
            "situacao_atual": {
                "type": "OBJECT",
                "properties": {"carta": {"type": "STRING"}, "interpretacao": {"type": "STRING"}}
            },
            "caminho_action": {
                "type": "OBJECT",
                "properties": {"carta": {"type": "STRING"}, "interpretacao": {"type": "STRING"}}
            },
            "resultado_conselho": {
                "type": "OBJECT",
                "properties": {"carta": {"type": "STRING"}, "interpretacao": {"type": "STRING"}}
            },
            "leitura_caminho": {
                "type": "OBJECT",
                "properties": {
                    "titulo": {"type": "STRING"}, 
                    "analise_detalhada": {"type": "STRING"}, 
                    "veredito_direto": {"type": "STRING"}
                }
            },
            "acolhimento_quantum": {
                "type": "OBJECT",
                "properties": {"titulo": {"type": "STRING"}, "conteudo": {"type": "STRING"}}
            },
            "ancoragem_rituais": {
                "type": "OBJECT",
                "properties": {
                    "mantra": {"type": "STRING"},
                    "salmo": {"type": "STRING"},
                    "banho": {"type": "STRING"},
                    "dica_angelical": {
                        "type": "OBJECT",
                        "properties": {
                            "foco_oracao": {"type": "STRING"},
                            "vela_cor": {"type": "STRING"},
                            "ritual_dias": {"type": "STRING"},
                            "dica_texto": {"type": "STRING"}
                        }
                    }
                }
            }
        }
    }

    generate_content_config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        thinking_config=types.ThinkingConfig(thinking_level="MINIMAL"),
        tools=tools,
        response_mime_type="application/json",
        response_schema=response_schema,
    )

    print("--- Sintonizando com o Portal Oráculo ---\n")
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if text := chunk.text:
            print(text, end="")

if __name__ == "__main__":
    generate()
