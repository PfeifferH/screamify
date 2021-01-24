import logo from './logo.svg';
import React, { Component } from 'react';
import './App.css';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ProgressBar from 'react-bootstrap/ProgressBar'
import Badge from 'react-bootstrap/Badge'
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
    this.state = { playing: false, playingname: "", midiURL: null, screamURL: null, loadProgress: 0, sampler: null };
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    } else {
      firebase.app(); // if already initialized, use that one
    }
    this.handleSongSelect = this.handleSongSelect.bind(this);
    this.handleScreamSelect = this.handleScreamSelect.bind(this);
    this.stopPlayback = this.stopPlayback.bind(this);
  }

  stopPlayback() {
    if (this.state.sampler != null) {
      this.state.sampler.releaseAll();
      this.state.sampler.dispose();
    }
    this.setState({ ...this.state, playingname: "", playing: false, sampler: null });
  }

  handleScreamSelect(screamURL) {
    console.log("SCREAM SELECTED");
    this.setState({ ...this.state, screamURL: screamURL }, () => this.startPlaying());
  }

  startPlaying() {
    console.log(this.state);
    if (this.state.midiURL != null && this.state.screamURL != null) {
      this.stopPlayback();
      var comps = this.state.screamURL.split("/");
      var url_base = this.state.screamURL.substring(0, this.state.screamURL.length - comps[comps.length - 1].length);
      var url_file = comps[comps.length - 1];
      this.play_screams(
        this.state.midiURL,
        url_base,
        url_file,
        "C4",
      );
    } else {
      // Something went wrong
      this.setState({ ...this.state, midiURL: null, screamURL: null, loadProgress: 0 });
    }
  }


  handleSongSelect(midiURL, name) {
    console.log("SONG SELECTED");
    console.log(midiURL);
    this.setState({ ...this.state, midiURL: midiURL, playingname: name });
  }

  componentDidUpdate() {

  }

  async play_screams(midi_url, sound_url, sound_file, sound_key) {
    console.log(11);
    this.setState({ ...this.state, loadProgress: 10 });
    const { Midi } = require('@tonejs/midi')
    // load a midi file in the browser
    console.log("Loading from:" + midi_url);
    const midi_json = await Midi.fromUrl(midi_url)
    this.setState({ ...this.state, loadProgress: 20 });
    console.log(2);
    // populate data structure
    var notes_array = [];
    var duration_array = [];
    var time_array = []
    console.log(3);
    //get the tracks

    console.log(midi_json);

    var notes = midi_json.tracks[4].notes;
    notes.forEach(note => {
      //note.midi, note.time, note.duration, note.name
      notes_array.push(note.name);
      duration_array.push(note.duration);
      time_array.push(note.time);
    })
    console.log(5);
    this.setState({ ...this.state, loadProgress: 30 });

    /*midi_json.tracks.forEach(track => {
      console.log(4);
      //notes are an array
      const notes = track.notes
      notes.forEach(note => {
        //note.midi, note.time, note.duration, note.name
        notes_array.push(note.name);
        duration_array.push(note.duration);
        time_array.push(note.time);
      })
      console.log(5);
    })*/
    console.log(6);
    this.setState({
      ...this.state, sampler: new Tone.Sampler({
        urls: {
          [sound_key]: sound_file,
        },
        release: 1,
        baseUrl: sound_url,
      }).toDestination()
    }, () => {
      console.log(7);
      this.setState({ ...this.state, loadProgress: 40 });
      // play sound
      const now = Tone.now();
      console.log(8);

      Tone.loaded().then(() => {
        var progress = 40;
        for (var i = 0; i < notes_array.length; i++) {
          console.log(9);
          this.state.sampler.triggerAttack(notes_array[i], now + time_array[i]);
          this.state.sampler.triggerRelease(now + time_array[i] + duration_array[i]);
          if (parseInt(40 + 60 * (i / notes_array.length)) - progress >= 5) {
            console.log(parseInt(40 + 60 * (i / notes_array.length)));
            this.setState({ ...this.state, loadProgress: parseInt(40 + 60 * (i / notes_array.length)) });
            progress = parseInt(40 + 60 * (i / notes_array.length));
          }
        }
        this.setState({ ...this.state, playing: true, midiURL: null, screamURL: null, loadProgress: 0 });
      })
      console.log(10);
    });
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
          <Navbar fixed="bottom" bg="dark" variant="dark" className="Player-bar">
            <Nav className="Player-nowplaying">
              {this.state.playing ? <img className="Player-nowplaying-img" src="img/mac_o.png" alt="Macintosh file icon" /> : <img className="Player-nowplaying-img" src="img/mac.png" alt="Macintosh file icon" />}

              <div className="Player-nowplaying-text">
                <h6>Now Playing</h6>
                <h5>{this.state.playing ? this.state.playingname : "Not Playing"}</h5>
              </div>
            </Nav>
            <Nav className="justify-content-center" >
              <Button disabled={!this.state.playing} onClick={this.stopPlayback} className="retro rbtn-big media">
                Stop
              </Button>
            </Nav>
            <div></div>
          </Navbar>
          <h4>Welcome to Screamify</h4>
          <div className="App-content retro">
            {this.state.midiURL == null && <h5>Song Library</h5>}
            {this.state.midiURL != null && this.state.screamURL == null && <h5>Scream Library</h5>}
            {this.state.midiURL != null && this.state.screamURL != null && <><h3>Loading audio... </h3><h4>Prepare to be wow-ed.</h4><ProgressBar animated now={this.state.loadProgress} /></>}
            {!(this.state.midiURL != null && this.state.screamURL != null) && <><hr /></>}
            <div className="gallery">
              {this.state.midiURL == null && <><Gallery playing={this.state.playing} collection="songs" icon="img/mac.png" onItemSelect={this.handleSongSelect} /></>}
              {this.state.midiURL != null && (this.state.screamURL == null && <><Gallery playing={this.state.playing} collection="scream" icon="img/dogcow.png" onItemSelect={this.handleScreamSelect} /></>)}
            </div>
          </div>
        </div>
      </div>

    );
  }
}

class Gallery extends Component {

  constructor(props) {
    super(props);
    this.state = { listenerUnsubscribe: null, data: <h5>No files</h5> };
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(midiURL, name) {
    this.props.onItemSelect(midiURL, name);
  }

  componentDidMount() {
    var db = firebase.firestore();
    this.setState({
      ...this.state,
      listenerUnsubscribe: db.collection(this.props.collection)
        .onSnapshot((snapshot) => {
          var data = <></>;
          if (snapshot.docs !== null && snapshot.docs.length >= 0) {
            data = snapshot.docs.map((doc) =>
              <GalleryItem key={doc.id} url={doc.data().url} icon={this.props.icon} onSongClick={this.handleClick} name={doc.data().name} />
            )
          }
          this.setState({
            ...this.state,
            data: data
          });
        })
    });
  }

  componentWillUnmount() {
    if (this.state.listenerUnsubscribe != null) {
      this.state.listenerUnsubscribe();
    }
  }

  handleChange(event) {
    this.setState({
      ...this.state,
      [event.target.name]: event.target.value
    });
  }

  render() {
    return (<>{this.state.data}
    </>
    );
  }
}

function GalleryItem(props) {
  return <div className='Gallery-item' onClick={() => { props.onSongClick(props.url, props.name) }}>
    <img className="Gallery-icon" src={props.icon} alt="Macintosh file icon" />
    <p>{props.name}</p>
  </div>;
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
