import requests, os, glob

cloud_name = 'dh0glzsnz'
upload_preset = 'houses'

videos = glob.glob('public/**/*.mp4', recursive=True)
print('Found ' + str(len(videos)) + ' videos')
for vid_path in videos:
    filename = os.path.splitext(os.path.basename(vid_path))[0]
    public_id = filename
    print('Uploading ' + filename + '...')
    with open(vid_path, 'rb') as f:
        response = requests.post(
            'https://api.cloudinary.com/v1_1/' + cloud_name + '/video/upload',
            data={'upload_preset': upload_preset, 'public_id': public_id},
            files={'file': f}
        )
    result = response.json()
    url = result.get('secure_url', str(result.get('error')))
    print(filename + ' -> ' + url)
