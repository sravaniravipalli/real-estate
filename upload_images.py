import requests, os, glob

cloud_name = 'dh0glzsnz'
upload_preset = 'houses'

images = glob.glob('public/houses/*.jpg')
for img_path in images:
    filename = os.path.splitext(os.path.basename(img_path))[0]
    public_id = 'houses/' + filename
    with open(img_path, 'rb') as f:
        response = requests.post(
            'https://api.cloudinary.com/v1_1/' + cloud_name + '/image/upload',
            data={'upload_preset': upload_preset, 'public_id': public_id},
            files={'file': f}
        )
    result = response.json()
    url = result.get('secure_url', str(result.get('error')))
    print(filename + ' -> ' + url)
