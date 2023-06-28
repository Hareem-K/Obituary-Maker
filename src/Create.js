import { useState } from "react";


function Create({ onCreate, handleClose}){
    const [name, setName] = useState("");
    const time = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const [birth, setBirth] = useState(time);
    const [death, setDeath] = useState(time);
    const [imageFile, setImageFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false); // Add loading state
  
    const onSubmitForm = async (e) => {
      e.preventDefault();
      if (!name || !birth || !death || !imageFile) {
        setErrorMessage("Please fill out all fields before generating");
        return;
      }

      setLoading(true); // Set loading state to true

      // Add the following line to display the message on the button
      e.target.innerText = "Please wait, it's not like they're gonna be late for something...";
      
      var obituary = {
        name: name,
        birth: birth,
        death: death,
        imageFile: imageFile,
      };

      const data = new FormData()
      // order matters
      data.append("imageFile", obituary.imageFile)
      data.append("name", obituary.name)
      data.append("birth", obituary.birth)
      data.append("death", obituary.death)

      try{
      // async function createObituary(){
        const res = await fetch(
          "https://6qfdmrbxpe4oryh65zzrt6g67m0wfkvj.lambda-url.ca-central-1.on.aws/",
          {
            method: "POST",
            body: data
          }
        );
      
        setLoading(false); // Set loading state to false
        e.target.innerText = "Write Obituary"; // Reset button text

        if (!res.ok) {
          // Handle the case when the response status is not ok
          setErrorMessage("Something went wrong. Please try again later.");
          return;
        }

      // }
      res.json().then((data)=> {console.log(data)
        obituary.image_res = data.image_res;
        obituary.description = data.description;
        obituary.polly_url = data.polly_url;
        onCreate(obituary);
      
      }); }
      catch (error) {
        // Handle the case when the fetch call fails
        setErrorMessage("Something went wrong. Please try again later.");
        setLoading(false); // Set loading state to false
        e.target.innerText = "Write Obituary"; // Reset button text
      }


      // you need to wait for the response and then create a new obituary
      // because you need the url to the image and the voice on Cloudinary
     
    };
  
    const onFileChange = (e) => {
      setImageFile(e.target.files[0]);
    };
  
    return (
      <div className="overlay">
      <div className="create">
        <h2 className="createobituarytext">Create a New Obituary</h2>
        <form className="formdiv">
          <div className="imgselectdiv">
            <input
              className="imgselect"
              type="file"
              required
              accept="images/*"
              onChange={onFileChange}
            />
          </div>
  
          <div className="nameboxdiv">
            <input
              className="namebox"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name of the deceased"
              required
            />
          </div>
  
          <i>Born: </i>
  
          <input
            className="birthselect"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            type="datetime-local"
            required
          />
  
          &emsp; &emsp; &emsp; &emsp; &emsp;
          <i>Died: </i>
          <input
            className="deathselect"
            value={death}
            onChange={(e) => setDeath(e.target.value)}
            type="datetime-local"
            required
          />
  
          <button className="writeobituarybutton" onClick={onSubmitForm} disabled={loading} >
            Write Obituary
          </button> 
          {errorMessage && (
            <p className="error-message">{errorMessage}</p>
          )}
        </form>
        <button className="close" onClick={handleClose}>
          X
        </button>
      </div>
      </div>
    );
  }
  

export default Create;
