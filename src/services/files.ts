export async function uploadFile(fileBuffer: ArrayBuffer, filename: string) {
    console.log('Uploading file:', filename)
    
    const timestamp = new Date().getTime();
    const formData = new FormData();

    console.log('Endpoint: ', `${Bun.env.FILE_UPLOAD_ENDPOINT}?filename=${timestamp}_${filename}`);
    formData.append('file', new Blob([fileBuffer]), filename);

    const response = await fetch(`${Bun.env.FILE_UPLOAD_ENDPOINT}?filename=${timestamp}_${filename}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${Bun.env.FILE_UPLOAD_TOKEN}`,
        },
        body: formData,
    })
    const responseText = await response.text();
    console.log('Response:', responseText);

    const data = JSON.parse(responseText);

    console.log('Parsed data:', data);

    return data.filename;
}
