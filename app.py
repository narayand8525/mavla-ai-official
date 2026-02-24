import streamlit as st
import google.generativeai as genai

# १. API सेटअप
API_KEY = "AIzaSyBNyXtg-aoJJPZqNvKqtjNRGr1YUyl-aDU"
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# २. पेज सेटिंग्ज (डिझाईन)
st.set_page_config(page_title="सक्षम AI मावळा", page_icon="🚩")

st.markdown("""
    <style>
    .main { background-color: #000000; color: white; }
    .stButton>button { background-color: #ff4b2b; color: white; border-radius: 20px; }
    </style>
    """, unsafe_allow_html=True)

st.title("🚩 सक्षम AI मावळा")
st.subheader("नारायण दाभाडकर निर्मित - सक्षम कॉम्प्युटर्स")

# ३. मावळ्याची इमेज
image_url = "https://i.ibb.co/mrrsKxGF/Gemini-Generated-Image-yqvvreyqvvreyqvv-1.png"
st.image(image_url, use_container_width=True)

# ४. चॅट हिस्ट्री
if "messages" not in st.session_state:
    st.session_state.messages = []

# जुने मेसेज दाखवा
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# ५. युजरकडून प्रश्न घेणे
if prompt := st.chat_input("मावळ्याला काहीतरी विचारा (उदा. गनिमी कावा म्हणजे काय?)"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        # मावळ्याची सिस्टीम सूचना
        instruction = "तू सक्षम AI मावळा आहेस. सुरुवात 'जय शिवराय' ने कर. उत्तर शुद्ध आणि करारी मराठीत दे."
        response = model.generate_content(f"{instruction} प्रश्न: {prompt}")
        
        st.markdown(response.text)
        st.session_state.messages.append({"role": "assistant", "content": response.text})
