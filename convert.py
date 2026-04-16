from PIL import Image
img = Image.open('gemini_logo.png')
# Resize for common icon sizes and save
img.save('gemini_logo.ico', format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64)])
