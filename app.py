import streamlit as st
import google.generativeai as genai

# १. API सेटअप (Direct Key)
API_KEY = "AIzaSyBNyXtg-aoJJPZqNvKqtjNRGr1YUyl-aDU"
genai.configure(api_key=API_KEY)

# मॉडेलचे नाव 'models/' लावून वापरले आहे जेणेकरून एरर येणार नाही
model = genai.GenerativeModel('models/gemini-1.5-flash')

# २. पेज आणि डिझाईन सेटिंग्ज
st.set_page_config(
    page_title="सक्षम AI मावळा",
    page_icon="🚩",
    layout="centered"
)

# CSS वापरून थोडा भगवा आणि काळा लूक (Maharashtrian Theme)
st.markdown("""
    <style>
    .stApp { background-color: #0e1117; color: white; }
    .stTextInput>div>div>input { background-color: #1c1917; color: white; border-radius: 10px; }
    .stChatMessage { border-radius: 15px; margin-bottom: 10px; }
    </style>
    """, unsafe_allow_html=True)

# ३. हेडर आणि ब्रँडिंग
st.title("🚩 सक्षम AI मावळा")
st.write("नारायण दाभाडकर निर्मित - सक्षम कॉम्प्युटर्स")

# मावळ्याची मुख्य इमेज
image_url = "https://i.ibb.co/mrrsKxGF/Gemini-Generated-Image-yqvvreyqvvreyqvv-1.png"
st.image(image_url, caption="जय शिवराय!", use_container_width=True)

# ४. चॅट हिस्ट्री मॅनेजमेंट
if "messages" not in st.session_state:
    st.session_state.messages = []

# जुने संवाद स्क्रीनवर दाखवा
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# ५. युजरचा इनपुट आणि AI प्रतिसाद
if prompt := st.chat_input("मावळ्याला काहीतरी विचारा..."):
    # युजरचा मेसेज सेव्ह करा आणि दाखवा
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # मावळ्याचा प्रतिसाद तयार करा
    with st.chat_message("assistant"):
        try:
            # सिस्टीम सूचना (System Instruction)
            system_prompt = (
                "तू सक्षम AI मावळा आहेस. "
                "नेहमी 'जय शिवराय!' ने सुरुवात कर. "
                "शुद्ध आणि करारी मराठीत उत्तरे दे. "
                "तुझे निर्माते नारायण दाभाडकर आहेत आणि तू सक्षम कॉम्प्युटर्ससाठी काम करतोस."
            )
            
            # प्रतिसाद मिळवा
            response = model.generate_content(f"{system_prompt}\n\nयुजरचा प्रश्न: {prompt}")
            
            # स्क्रीनवर दाखवा आणि सेव्ह करा
            st.markdown(response.text)
            st.session_state.messages.append({"role": "assistant", "content": response.text})
            
        except Exception as e:
            st.error(f"क्षमा करा, काहीतरी तांत्रिक अडचण आली: {str(e)}")

# ६. तळटीप (Footer)
st.markdown("---")
st.caption("© २०२६ सक्षम कॉम्प्युटर्स - जालना")
