from langchain.chat_models import init_chat_model

model = init_chat_model("ollama:llama3.1", temperature=0.7)

response = model.invoke([{"role": "user", "content": "Hey, rough day today."}])
print(response.content)