async function getdataurl(imgSRC) {
    let blob = await fetch(imgSRC).then(r => r.blob());
    let dataUrl = await new Promise(resolve => {
        let reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
    return dataUrl;
}

// https://stackoverflow.com/questions/25690641/img-url-to-dataurl-using-javascript