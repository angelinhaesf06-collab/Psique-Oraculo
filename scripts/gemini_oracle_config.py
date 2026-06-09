# To run this code you need to install the following dependencies:
# pip install google-genai

import os
from google import genai
from google.genai import types


def generate():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-3.1-flash-lite"
    
    # Contexto do Psique-Oráculo
    input_prompt = """
    Consulente: Angela. 
    Tema: Carreira e Propósito. 
    Pergunta: Devo iniciar meu novo projeto agora? 
    Oráculo: TARÔ. 
    Cartas: O Louco, A Roda da Fortuna, O Sol. 
    Método: leitura_completa.
    """

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=input_prompt),
            ],
        ),
    ]
    
    tools = [
        types.Tool(url_context=types.UrlContext()),
        types.Tool(googleSearch=types.GoogleSearch()),
    ]

    # Esquema de Resposta (Schema) mapeado do seu backend Psique-Oráculo
    response_schema = genai.types.Schema(
        type = genai.types.Type.OBJECT,
        properties = {
            "oraculo_utilizado": genai.types.Schema(type = genai.types.Type.STRING),
            "tema": genai.types.Schema(type = genai.types.Type.STRING),
            "situacao_atual": genai.types.Schema(
                type = genai.types.Type.OBJECT,
                properties = {
                    "carta": genai.types.Schema(type = genai.types.Type.STRING),
                    "interpretacao": genai.types.Schema(type = genai.types.Type.STRING),
                }
            ),
            "caminho_acao": genai.types.Schema(
                type = genai.types.Type.OBJECT,
                properties = {
                    "carta": genai.types.Schema(type = genai.types.Type.STRING),
                    "interpretacao": genai.types.Schema(type = genai.types.Type.STRING),
                }
            ),
            "resultado_conselho": genai.types.Schema(
                type = genai.types.Type.OBJECT,
                properties = {
                    "carta": genai.types.Schema(type = genai.types.Type.STRING),
                    "interpretacao": genai.types.Schema(type = genai.types.Type.STRING),
                }
            ),
            "leitura_caminho": genai.types.Schema(
                type = genai.types.Type.OBJECT,
                properties = {
                    "titulo": genai.types.Schema(type = genai.types.Type.STRING),
                    "analise_detalhada": genai.types.Schema(type = genai.types.Type.STRING),
                    "veredito_direto": genai.types.Schema(type = genai.types.Type.STRING),
                }
            ),
            "acolhimento_quantum": genai.types.Schema(
                type = genai.types.Type.OBJECT,
                properties = {
                    "titulo": genai.types.Schema(type = genai.types.Type.STRING),
                    "conteudo": genai.types.Schema(type = genai.types.Type.STRING),
                }
            ),
            "ancoragem_rituais": genai.types.Schema(
                type = genai.types.Type.OBJECT,
                properties = {
                    "mantra": genai.types.Schema(type = genai.types.Type.STRING),
                    "salmo": genai.types.Schema(type = genai.types.Type.STRING),
                    "banho": genai.types.Schema(type = genai.types.Type.STRING),
                    "dica_angelical": genai.types.Schema(
                        type = genai.types.Type.OBJECT,
                        properties = {
                            "foco_oracao": genai.types.Schema(type = genai.types.Type.STRING),
                            "vela_cor": genai.types.Schema(type = genai.types.Type.STRING),
                            "ritual_dias": genai.types.Schema(type = genai.types.Type.STRING),
                            "dica_texto": genai.types.Schema(type = genai.types.Type.STRING),
                        }
                    ),
                }
            ),
        },
    )

    generate_content_config = types.GenerateContentConfig(
        system_instruction="""
          Você é o "Psiquê Oráculo", um mentor de alma e autoridade mística (Voz: Junguiana, Poética, Empática).
          Responda RIGOROSAMENTE em PORTUGUÊS DO BRASIL em JSON PURO.

          REGRAS POR ORÁCULO:
          1. TARÔ: Foco Arquetípico. Cite Arcanos em PORTUGUÊS. Mantra final.
          2. CIGANO: Preditivo/Prático. Nome + Número. Ofereça Banho/Cristal/Erva. Campo 'salmo': Dica da Cigana.
          3. ANJOS: Amparo Angelical. Nome do Anjo. Salmo real, Arcanjo e Versículo. 
             Campo 'dica_angelical': ritual completo. NUNCA envie banhos aqui.
        """,
        thinking_config=types.ThinkingConfig(
            thinking_level="MINIMAL",
        ),
        tools=tools,
        response_mime_type="application/json",
        response_schema=response_schema,
    )

    print("--- Sintonizando com o Portal Oráculo (Template Customizado) ---\n")
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if text := chunk.text:
            print(text, end="")

if __name__ == "__main__":
    generate()
