# import os
# from langchain_community.document_loaders import TextLoader
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain_huggingface import HuggingFaceEmbeddings  # Updated import
# from langchain_community.vectorstores import FAISS
# from langchain_google_genai import GoogleGenerativeAI
# from langchain.chains import RetrievalQA

# # Step 1: Load Document
# def load_document(file_path):
#     loader = TextLoader(file_path)
#     documents = loader.load()
#     return documents

# # Step 2: Split Document into Chunks
# def split_documents(documents):
#     text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
#     docs = text_splitter.split_documents(documents)
#     return docs

# # Step 3: Create Embeddings (Fixed)
# def create_embeddings():
#     embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
#     return embeddings

# # Step 4: Store in Local Vector Database (FAISS)
# def store_embeddings(docs, embeddings):
#     vector_db = FAISS.from_documents(docs, embeddings)
#     vector_db.save_local("faiss_index")
#     return vector_db

# # Step 5: Load the Vector Database (Fixed)
# def load_vector_db(embeddings):
#     vector_db = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)
#     return vector_db

# # Step 6: Set Up Retriever
# def get_retriever(vector_db):
#     retriever = vector_db.as_retriever(search_kwargs={"k": 3})  # Retrieve top 3 relevant docs
#     return retriever

# # Step 7: Use Gemini 1.5 to Generate Responses
# from langchain.prompts import PromptTemplate
# from langchain.chains import create_retrieval_chain

# def setup_gemini(api_key, retriever):
#     # Define an advanced system prompt for smart query handling
#     system_prompt = """
#     You are a specialized medical chatbot that focuses on eye diseases, treatments, and eye-related medical queries. 
#     Your responses should follow these guidelines:

#     Check Document First: When a user asks a question, first check if relevant information exists in the provided document.
#         - If found, retrieve and enhance the response using your LLM capabilities.

#     If Not in Document but Eye-Related: If the document does not contain relevant information, but the question is about eye health, generate a response using your medical knowledge.

#     If General Medical but Not Eye-Related: If the question is about general medical topics but **not** directly related to eye health:
#         - Inform the user that you are an eye health specialist but **still try to provide useful medical insights.

#     If Not Medical-Related at All: If the question is unrelated to medical topics:
#         - Respond with: "I'm sorry, but I specialize only in eye-related medical queries. I cannot provide an answer to this topic."

#     Below is the retrieved context from the document. If available, use this to answer the user's query:
    
#     {context}
    
#     Now, answer the following question:
#     User question: {input}

#     Response:
#     """

#     # Create a prompt template that ensures the LLM considers both retrieved context and fallback logic
#     prompt = PromptTemplate.from_template(system_prompt)

#     # Initialize Gemini 2.0 Flash
#     llm = GoogleGenerativeAI(
#         model="gemini-2.0-flash",
#         google_api_key=api_key
#     )

#     # Create the retrieval chain with augmented LLM logic
#     retrieval_chain = create_retrieval_chain(retriever, prompt | llm)

#     return retrieval_chain


# # Main Function
# def main():
#     api_key = "AIzaSyAXCCmQSzlWTByBKSiIJ4YKrzJr-ozdbZU"  # Replace with your actual Gemini API Key
#     document_path = "document.txt"  # Replace with your actual document

#      # Load and process document
#     documents = load_document(document_path)
#     docs = split_documents(documents)
    
#     # Create embeddings and store in FAISS
#     embeddings = create_embeddings()
#     vector_db = store_embeddings(docs, embeddings)

#     # Load the stored vector DB and create retriever
#     vector_db = load_vector_db(embeddings)
#     retriever = get_retriever(vector_db)

#     # Setup Gemini 2.0 Flash LLM
#     qa_chain = setup_gemini(api_key, retriever)

#     # Chat with the bot
#     print("Medical Chatbot is ready! Type 'exit' to stop.")
#     while True:
#         query = input("\nYou: ")
#         if query.lower() == "exit":
#             print("Chatbot session ended.")
#             break

#         response = qa_chain.invoke({"input": query})  # ✅ Fixed to use "input"

#         # Extract only the "answer" field from the response dictionary
#         if isinstance(response, dict) and "answer" in response:
#             print("\nBot:", response["answer"])
#         else:
#             print("\nBot: Sorry, I couldn't find a relevant answer.")

# # Run the chatbot
# if __name__ == "__main__":
#     main()

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import create_retrieval_chain

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests (for frontend)

# API Key for Gemini 2.0 Flash
API_KEY = "AIzaSyAXCCmQSzlWTByBKSiIJ4YKrzJr-ozdbZU"  # Replace with your actual key
DOCUMENT_PATH = "document.txt"  # Ensure this file exists

# Step 1: Load Document
def load_document(file_path):
    loader = TextLoader(file_path)
    return loader.load()

# Step 2: Split Document into Chunks
def split_documents(documents):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    return text_splitter.split_documents(documents)

# Step 3: Create Embeddings
def create_embeddings():
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Step 4: Store in FAISS Vector Database
def store_embeddings(docs, embeddings):
    vector_db = FAISS.from_documents(docs, embeddings)
    vector_db.save_local("faiss_index")
    return vector_db

# Step 5: Load FAISS Database
def load_vector_db(embeddings):
    return FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

# Step 6: Get Retriever
def get_retriever(vector_db):
    return vector_db.as_retriever(search_kwargs={"k": 3})

# Step 7: Set Up Gemini 2.0 Flash with Context-Aware Retrieval
def setup_gemini(api_key, retriever):
    system_prompt = """
    You are a specialized medical chatbot that focuses on eye diseases, treatments, and eye-related medical queries. 
    Your responses should follow these guidelines:

    Check Document First: When a user asks a question, first check if relevant information exists in the provided document.
        - If found, retrieve and enhance the response using your LLM capabilities.

    If Not in Document but Eye-Related: If the document does not contain relevant information, but the question is about eye health, generate a response using your medical knowledge.

    If General Medical but Not Eye-Related: If the question is about general medical topics but **not** directly related to eye health:
        - Inform the user that you are an eye health specialist but **still try to provide useful medical insights.

    If Not Medical-Related at All: If the question is unrelated to medical topics:
        - Respond with: "I'm sorry, but I specialize only in eye-related medical queries. I cannot provide an answer to this topic."

    Below is the retrieved context from the document. If available, use this to answer the user's query:
    
    {context}
    
    Now, answer the following question:
    User question: {input}

    Response:
    """

    prompt = PromptTemplate.from_template(system_prompt)
    llm = GoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=api_key)
    return create_retrieval_chain(retriever, prompt | llm)

# Load and Set Up Chatbot
documents = load_document(DOCUMENT_PATH)
docs = split_documents(documents)
embeddings = create_embeddings()
vector_db = store_embeddings(docs, embeddings)
retriever = get_retriever(load_vector_db(embeddings))
chatbot = setup_gemini(API_KEY, retriever)

# Define Chat API Endpoint
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_input = data.get("message", "")

    if not user_input:
        return jsonify({"error": "Empty input"}), 400

    response = chatbot.invoke({"input": user_input})

    # Extract only the answer field
    chatbot_reply = response.get("answer", "I'm sorry, I couldn't find a relevant answer.")
    return jsonify({"response": chatbot_reply})

# Run Flask App
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)
