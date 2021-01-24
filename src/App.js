import logo from './logo.svg';
import React, { Component } from 'react';
import './App.css';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Badge from 'react-bootstrap/Badge'
import { parseArrayBuffer } from 'midi-json-parser';
import * as Tone from 'tone'
import fs from 'fs'


// Firebase
// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import firebase from "firebase/app";
// Add the Firebase services that you want to use
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";

var firebaseConfig = {
  apiKey: "AIzaSyB45JGaUWLS6eknDs4QEcoLm7zcUF2z5KY",
  authDomain: "screamify-63c29.firebaseapp.com",
  projectId: "screamify-63c29",
  storageBucket: "screamify-63c29.appspot.com",
  messagingSenderId: "989390125740",
  appId: "1:989390125740:web:d3b8a357148f21d764bd09"
};


class App extends Component {
  constructor(props) {
    super(props);
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    } else {
      firebase.app(); // if already initialized, use that one
    }
  }


  async play_screams(midi_url, sound_url, sound_file, sound_key) {

    const { Midi } = require('@tonejs/midi')

    // load a midi file in the browser
    const midi_json = await Midi.fromUrl(midi_url)

    // populate data structure
    var notes_array = [];
    var duration_array = [];
    var time_array = []
    //get the tracks
    midi_json.tracks.forEach(track => {
      //notes are an array
      const notes = track.notes
      notes.forEach(note => {
        //note.midi, note.time, note.duration, note.name
        notes_array.push(note.name);
        duration_array.push(note.duration);
        time_array.push(note.time);
      })
    })


    // const sampler = new Tone.Sampler({
    //   urls: {
    //     "C4": "gurgling_theremin_1.mp3",
    //   },
    //   release: 1,
    //   baseUrl: "https://tonejs.github.io/audio/berklee/",
    // }).toDestination();

    // const sampler = new Tone.Sampler({
    //   urls: {
    //     "A4": "Slide_String_1_%28short%29.ogg",
    //   },
    //   release: 1,
    //   baseUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5f/",
    // }).toDestination();

    // const sampler = new Tone.Sampler({
    //   urls: {
    //     "A4": "gong_1.mp3",
    //   },
    //   release: 1,
    //   baseUrl: "https://tonejs.github.io/audio/berklee/",
    // }).toDestination();

    const sampler = new Tone.Sampler({
      urls: {
        "C4": sound_file,
      },
      release: 1,
      baseUrl: sound_url,
    }).toDestination();

    // play sound
    const now = Tone.now();
    var time = 0;
    Tone.loaded().then(() => {
      for (var i = 0; i < midi_json.tracks[1].notes.length; i++)
      {
        sampler.triggerAttack(notes_array[i], now + time_array[i])
        sampler.triggerRelease(now + time_array[i] + duration_array[i])
      }
    })

    return
  }


  render() {

    // Sounds
    // https://upload.wikimedia.org/wikipedia/commons/5/5f/   --- Slide_String_1_%28short%29.ogg
    // https://tonejs.github.io/audio/berklee/    --- gong_1.mp3, gurgling_theremin_1.mp3

    this.play_screams(
      "https://upload.wikimedia.org/wikipedia/commons/5/55/MIDI_sample.mid",
      "https://tonejs.github.io/audio/berklee/",
      "gong_1.mp3",
      "C4",
      )

    return (
      <div className="App">
        <header className="App-header">
          Welcome To Screamify
      </header>
        <div className="App-body">
          <Button className="Button" variant="secondary">SCREAM</Button>{' '}
          <FileUpload></FileUpload>
        </div>
      </div>
    );
  }
}





class FileUpload extends Component {
  handleSubmit(event) {
    const form = event.currentTarget;
    event.preventDefault();

    var db = firebase.firestore();
    var storageRef = firebase.storage().ref();

    var doc = db.collection("scream").add({
      name: this.state.name,
      note: this.state.note
    })
      .then((docRef) => {
        console.log("Document written with ID: ", docRef.id);

        // Create a reference to file
        var screamFileRef = storageRef.child('screams/' + docRef.id);
        var uploadTask = screamFileRef.put(this.state.file);

        uploadTask.on('state_changed',
          (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
              case firebase.storage.TaskState.PAUSED: // or 'paused'
                console.log('Upload is paused');
                break;
              case firebase.storage.TaskState.RUNNING: // or 'running'
                console.log('Upload is running');
                break;
            }
          },
          (error) => {
            // Handle unsuccessful uploads
          },
          () => {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
              console.log('File available at', downloadURL);
              
              doc.update({
                url: downloadURL
              }).then((docRef) => {
                console.log("Document updated");
                // Reset form
                this.setState({ ...this.state, name: '', filename: "select a file...", file: '', note: 'A' });
              })
                .catch((error) => {
                  console.error("Error updating document: ", error);
                  // Reset form
                  this.setState({ ...this.state, name: '', filename: "select a file...", file: '', note: 'A' });
                });
            });
          }
        );

      })
      .catch(function (error) {
        console.error("Error adding document: ", error);
      });

  };

  constructor(props) {
    super(props);
    this.state = { name: '', filename: "select a file...", file: '', note: 'A' };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);
  }

  handleChange(event) {
    this.setState({
      ...this.state,
      [event.target.name]: event.target.value
    });
  }

  handleFileChange(event) {
    this.setState({
      ...this.state,
      filename: event.target.files[0].name,
      [event.target.name]: event.target.files[0]
    });
  }

  render() {
    return (<>
      <h2>Add a New Scream</h2>
      <Form onSubmit={this.handleSubmit}>
        <Form.Label>Scream Name</Form.Label>
        <Form.Control type="text" placeholder="Name" name="name" value={this.state.name} onChange={this.handleChange} />
        <Form.Label>File</Form.Label>
        <Form.File
          name="file"
          onChange={this.handleFileChange}
          id="custom-file"
          label={this.state.filename}
          custom
        />
        <Form.Group controlId="exampleForm.ControlSelect1">
          <Form.Label>Note</Form.Label>
          <Form.Control as="select" name="note" value={this.state.note} onChange={this.handleChange}>
            <option>A</option>
            <option>A#</option>
            <option>B</option>
            <option>C</option>
            <option>C#</option>
            <option>D</option>
            <option>D#</option>
            <option>E</option>
            <option>F</option>
            <option>F#</option>
            <option>G</option>
            <option>G#</option>
          </Form.Control>
        </Form.Group>
        <Button variant="primary" type="submit">
          Upload
          </Button>
      </Form>
    </>
    );
  }
}

export default App;
