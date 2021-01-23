import logo from './logo.svg';
import React, { Component } from 'react';
import './App.css';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ProgressBar from 'react-bootstrap/ProgressBar'
import Badge from 'react-bootstrap/Badge'
import { parseArrayBuffer } from 'midi-json-parser';
import * as Tone from 'tone'
import fs from 'fs'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'

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

    const sampler = new Tone.Sampler({
      urls: {
        [sound_key]: sound_file,
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
    /*this.play_screams(
      "https://upload.wikimedia.org/wikipedia/commons/5/55/MIDI_sample.mid",
      "https://tonejs.github.io/audio/berklee/",
      "gong_1.mp3",
      "C4",
      )*/
    return (
      <div className="App">
        <div className="App-sidebar">
          <h3>Admin Stuff</h3>
          <ScreamUpload></ScreamUpload>
          <MIDIUpload></MIDIUpload>
        </div>
        <div className="App-body">
          <Navbar fixed="bottom" bg="dark" variant="dark" className="justify-content-center">
            <Nav className="justify-content-center">
              <Button className="retro rbtn-big media">
                Play
              </Button>
              <Button className="retro rbtn-big media">
                Stop
              </Button>
              <Button className="retro rbtn-big media">
                Skip
              </Button>
            </Nav>
          </Navbar>
          <div className="App-content">
            <header className="App-header">
              Welcome To Screamify
          </header>
            <Button className="Button" variant="secondary">SCREAM</Button>{' '}
          </div>
        </div>
      </div>

    );
  }
}

class ScreamUpload extends Component {
  handleSubmit(event) {
    event.preventDefault();

    if (this.state.name != '' && this.state.file != '') {
      this.setState({ ...this.state, submittext: 'Uploading...', submitting: true });
      var db = firebase.firestore();
      var storageRef = firebase.storage().ref();

      var doc = db.collection("scream").doc();
      doc.set({
        name: this.state.name,
        note: this.state.note
      })
        .then(() => {
          console.log("Document written with ID: ", doc.id);

          // Create a reference to file
          var screamFileRef = storageRef.child('screams/' + doc.id);
          var uploadTask = screamFileRef.put(this.state.file);

          uploadTask.on('state_changed',
            (snapshot) => {
              // Observe state change events such as progress, pause, and resume
              // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
              var uploadprogress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              this.setState({ ...this.state, progress: uploadprogress });
              console.log('Upload is ' + uploadprogress + '% done');
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
              uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                console.log('File available at', downloadURL);

                doc.update({
                  url: downloadURL
                }).then((doc) => {
                  console.log("Document updated");
                  // Reset form
                  this.setState({ ...this.state, name: '', filename: "select a file...", file: '', note: 'A', submittext: 'Upload', submitting: false, progress: 0 });
                })
                  .catch((error) => {
                    console.error("Error updating document: ", error);
                    // Reset form
                    this.setState({ ...this.state, name: '', filename: "select a file...", file: '', note: 'A', submittext: 'Upload', submitting: false, progress: 0 });
                  });
              });
            }
          );

        })
        .catch(function (error) {
          console.error("Error adding document: ", error);
        });
    } else {
      console.log("MUST FILL INFO");
    }
  };

  constructor(props) {
    super(props);
    this.state = { name: '', filename: "select a file...", file: '', note: 'A', submittext: 'Upload', submitting: false, progress: 0 };
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
    return (<div className="retro">
      <h5>Add a New Scream</h5>
      <Form onSubmit={this.handleSubmit}>

        <Form.Group as={Row} controlId="formHorizontalName">
          <Form.Label column sm={2}>
            Name
          </Form.Label>
          <Col sm={10}>
            <Form.Control type="text" placeholder="Name" name="name" value={this.state.name} onChange={this.handleChange} />
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId="formHorizontalName">
          <Form.Label column sm={2}>File</Form.Label>
          <Col sm={10}>
            <Form.File
              name="file"
              onChange={this.handleFileChange}
              id="custom-file"
              label={this.state.filename}
              custom
            /></Col>
        </Form.Group>
        <Form.Group as={Row} controlId="exampleForm.ControlSelect1">
          <Form.Label column sm={2}>Note</Form.Label>
          <Col sm={10}>
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
            </Form.Control></Col>
        </Form.Group>
        {this.state.submitting == true ? <ProgressBar animated now={this.state.progress} /> :
          <Button className="retro rbtn-small" type="submit">
            {this.state.submittext}
          </Button>

        }
      </Form>

    </div>
    );
  }
}

class MIDIUpload extends Component {
  handleSubmit(event) {
    event.preventDefault();

    if (this.state.name != '' && this.state.file != '') {
      this.setState({ ...this.state, submittext: 'Uploading...', submitting: true });
      var db = firebase.firestore();
      var storageRef = firebase.storage().ref();

      var doc = db.collection("songs").doc();
      doc.set({
        name: this.state.name
      })
        .then(() => {
          console.log("Document written with ID: ", doc.id);

          // Create a reference to file
          var screamFileRef = storageRef.child('songs/' + doc.id);
          var uploadTask = screamFileRef.put(this.state.file);

          uploadTask.on('state_changed',
            (snapshot) => {
              // Observe state change events such as progress, pause, and resume
              // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
              var uploadprogress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              this.setState({ ...this.state, progress: uploadprogress });
              console.log('Upload is ' + uploadprogress + '% done');
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
              uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                console.log('File available at', downloadURL);

                doc.update({
                  url: downloadURL
                }).then((doc) => {
                  console.log("Document updated");
                  // Reset form
                  this.setState({ ...this.state, name: '', filename: "select a MIDI file...", file: '', submittext: 'Upload', submitting: false, progress: 0 });
                })
                  .catch((error) => {
                    console.error("Error updating document: ", error);
                    // Reset form
                    this.setState({ ...this.state, name: '', filename: "select a MIDI file...", file: '', submittext: 'Upload', submitting: false, progress: 0 });
                  });
              });
            }
          );

        })
        .catch(function (error) {
          console.error("Error adding document: ", error);
        });
    } else {
      console.log("MUST FILL INFO");
    }
  };

  constructor(props) {
    super(props);
    this.state = { name: '', filename: "select a file...", file: '', submittext: 'Upload', submitting: false, progress: 0 };
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
    return (<div className="retro">
      <h5>Add a New Song</h5>
      <Form onSubmit={this.handleSubmit}>

        <Form.Group as={Row} controlId="formHorizontalName">
          <Form.Label column sm={2}>
            Name
          </Form.Label>
          <Col sm={10}>
            <Form.Control type="text" placeholder="Song Name" name="name" value={this.state.name} onChange={this.handleChange} />
          </Col>
        </Form.Group>
        <Form.Group as={Row} controlId="formHorizontalName">
          <Form.Label column sm={2}>File</Form.Label>
          <Col sm={10}>
            <Form.File
              name="file"
              onChange={this.handleFileChange}
              id="custom-file"
              label={this.state.filename}
              custom
            /></Col>
        </Form.Group>
        {this.state.submitting == true ? <ProgressBar animated now={this.state.progress} /> :
          <Button className="retro rbtn-small" type="submit">
            {this.state.submittext}
          </Button>

        }
      </Form>

    </div>
    );
  }
}

export default App;
