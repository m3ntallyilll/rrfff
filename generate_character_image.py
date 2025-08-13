#!/usr/bin/env python3
"""
Generate a new photorealistic portrait for MC Silk using internal AI image generation
"""

import os
import requests
import json
from datetime import datetime

def generate_mc_silk_portrait():
    """Generate a new photorealistic portrait for MC Silk"""
    
    # Enhanced prompt for MC Silk - black male rapper
    prompt = """
    Photorealistic portrait of a confident black male rap battle artist, MC Silk. 
    Professional studio lighting, sharp focus, high detail. 
    Age 25-30, strong jawline, intense focused eyes, short styled hair or fade cut.
    Wearing modern streetwear - gold chain, fitted cap or beanie, urban style.
    Confident, smooth expression showing intelligence and lyrical skill.
    Background should be dark/neutral to focus on the face.
    Style: Professional headshot, cinematic lighting, 4K quality.
    """
    
    try:
        # Check if OpenAI API key is available
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            print("No OpenAI API key found - cannot generate image")
            return None
            
        # Use DALL-E 3 for high-quality generation
        response = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "dall-e-3",
                "prompt": prompt,
                "n": 1,
                "size": "1024x1024",
                "quality": "hd",
                "style": "vivid"
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            image_url = result['data'][0]['url']
            
            # Download the image
            img_response = requests.get(image_url)
            if img_response.status_code == 200:
                # Save to attached_assets with unique name
                timestamp = int(datetime.now().timestamp())
                filename = f"MC_Silk_new_portrait_{timestamp}.png"
                filepath = f"attached_assets/{filename}"
                
                with open(filepath, 'wb') as f:
                    f.write(img_response.content)
                
                print(f"✅ Generated new MC Silk portrait: {filename}")
                print(f"📁 Saved to: {filepath}")
                return filename
            else:
                print(f"❌ Failed to download image: {img_response.status_code}")
                return None
        else:
            print(f"❌ Image generation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error generating image: {str(e)}")
        return None

if __name__ == "__main__":
    print("🎨 Generating new photorealistic portrait for MC Silk...")
    result = generate_mc_silk_portrait()
    
    if result:
        print("🎉 Image generation successful!")
    else:
        print("💥 Image generation failed - check logs above")