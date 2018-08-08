/* Electron Remote */
const remote = require("electron").remote;
const app = remote.app;
const mainApp = remote.require("./main.js");
const MenuElc = remote.Menu;
const MenuItemElc = remote.MenuItem;

const path = require("path");
const url = require("url");

import React from "react";
import ReactDOM from "react-dom";

const request = require("request");

const root = document.getElementById("root");
//root.classList.add("pt-dark"); Main App Renderer
document.addEventListener("DOMContentLoaded", e => {
  ReactDOM.render(<App />, root);
});

//Socket IO Client
const io = require("socket.io-client");

import ChatStore from "./chatStore";
//Convert Size into Supported DOM Sizes
import { makeValidSize, checkEmail } from "./utils/utils";

//Main Session and Cookies
let mainSession = remote.getCurrentWebContents().session;
let cookies = mainSession.cookies;

//Axios
let axios = require("axios");

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      senderName: "",
      url: "",
      users: [],
      messages: [],
      status: "",
      typing: {
        state: false,
        username: ""
      },
      showRegisterBox: false,
      showLoginBox: true,
      loginSuccess: false,
      showUpdateUserDetails: false
    };
  }

  initSocket() {
    //Connect to the Server using Socket IO
    this.io = io("http://localhost:3000");
    console.log("IO: ", this.io);
    //Connected Status
    this.setState({ status: "connected" });
    //Connection Event
    this.triggerConnected();
  }

  //Emit Connection Event to the Socket io server
  triggerConnected() {
    if (!this.io)
      console.log("App Not Initialized Please Call this After initSocket!");
    console.log("Emiiting Connected Users ", this.state.username);
    this.io.emit("connectedUser", this.state.username); ///< Override the Base Connect Event
  }

  triggerDisconnected() {
    this.io.emit("disconnectedUser", ChatStore.getUsername());
    //Remove Instance
    this.io.disconnect();
    //Show Login Page
    this.setState({ showLoginBox: true, loginSuccess: false });
    //Remove Cookies
    this.removeAuthCookies();
  }

  removeAuthCookies() {
    cookies.remove("http://localhost", "JWToken", () => {});
    cookies.remove("http://localhost", "username", () => {});
  }

  toggleUpdateUserDetails(show = true) {
    this.setState({ showUpdateUserDetails: show });
  }

  componentWillMount() {
    //Check For Authentication Cookies (JWT and Username), if exists! on App Startup
    //JWT Cookie
    cookies.get(
      {
        name: "JWToken"
      },
      (err, ck) => {
        if (ck.length > 0 && ck) {
          //Set Default Header for Next Requests
          console.log("AXIOS ", axios);
          axios.defaults.headers.common["Authentication"] =
            "JWT " + ck[0].value;

          //Get Username Cookie
          cookies.get(
            {
              name: "username"
            },
            (err, ck1) => {
              if (err)
                console.log("Username Could Not Be Fetched from the Cookie");
              else if (ck1.length > 0 && ck1) {
                let fetchedUsername = ck1[0].value;
                //let fetchedURL = ck1[0].value.split(" ")[0];
                console.log("Fetched Username from Cookies: ", fetchedUsername);
                // Initialize the ChatStore and retreive data from cookie //TODO: Change from
                // cookie into local JSON CONFIG FILE
                ChatStore.init(fetchedUsername);
                //Everything is OK Hide the Login Box, Next Time :) Baypass Login Request
                this.setState({
                  loginSuccess: true,
                  showLoginBox: false,
                  showRegisterBox: false
                });
              }
            }
          );
        }
      }
    );

    //Event Listeners Chat Session Initialized!
    ChatStore.on("initialized", username => {
      this.setState({
        username: username
      });
      console.log("USERNAME : ", username);
      this.initSocket(); ///< Initialize Sockets
      //Update Username and Login box open state
      this.setState({
        username: username,
        loginSuccess: true,
        showLoginBox: false
      });
      console.log("Initialized! ");

      //Disconnect Event
      app.on("will-quit", () => {
        this.io.emit("disconnectedUser", this.state.username);
      });

      //Accpet Messages From Other Clients
      this.io.on("chat-message", msg => {
        console.log("Received New Message ", msg);
        if (
          msg.username &&
          msg.message &&
          msg.username != this.state.username
        ) {
          this.setState(prevState => ({
            messages: [
              ...prevState.messages,
              {
                message: msg.message,
                username: msg.username
              }
            ]
          }));
        }
      });

      /* TYPING FEATURE! */
      //On Typing From The Store
      ChatStore.on("is-typing", () => {
        //Trigger Server Typing Event
        this.io.emit("is-typing", this.state.username);
      });
      ChatStore.on("stopped-typing", () => {
        this.io.emit("stopped-typing", this.state.username);
      });

      //On Start Typing From the Sockets
      this.io.on("is-typing", user => {
        //Set Typing Object (Started)
        this.setState({
          typing: {
            state: true,
            username: user
          }
        });
      });
      //On Stopped Typing
      this.io.on("stopped-typing", user => {
        //Set Typing Object (Stopped)
        this.setState({
          typing: {
            state: false,
            username: user
          }
        });
      });
    });

    //Update Messages
    ChatStore.on("new-message", msg => {
      console.log("New MESSAGE", msg, this.state.username);
      //Send MESSAGE Over Sockets
      this.io.emit("chat-message", {
        message: msg,
        username: this.state.username
      });

      //Update Messages
      this.setState(prevState => ({
        messages: [
          ...prevState.messages,
          {
            message: msg,
            username: this.state.username
          }
        ]
      }));
    });
  }

  handleRegisterClick() {
    this.setState({ showLoginBox: false, showRegisterBox: true });
  }

  handleLoginClick() {
    this.setState({ showRegisterBox: false, showLoginBox: true });
  }

  //Change Username
  changeUsername(username) {
    this.setState({ username: username });
  }

  render() {
    console.log("SHOW UPDAYE USER DETAILS: ", this.state.showUpdateUserDetails);
    return (
      <div className="flex-parent">
        <LoginBox
          isOpen={this.state.showLoginBox}
          handleRegisterClick={this.handleRegisterClick.bind(this)}
        />{" "}
        {this.state.showRegisterBox ? (
          <RegisterBox handleLoginClick={this.handleLoginClick.bind(this)} />
        ) : null}{" "}
        {this.state.showUpdateUserDetails && (
          <UpdateUserDetails
            showUpdateUserDetails={this.state.showUpdateUserDetails}
          />
        )}
        {this.state.loginSuccess && (
          <ChatContainer
            current={this.state.username}
            messages={this.state.messages}
            typing={this.state.typing}
            request={this.state.request}
            changeUsername={this.changeUsername.bind(this)}
            username={this.state.username}
            triggerDisconnected={this.triggerDisconnected.bind(this)}
            showUpdteUserDetails={this.state.showUpdateUserDetails}
            toggleUpdateUserDetails={this.toggleUpdateUserDetails.bind(this)}
          />
        )}{" "}
        {this.state.loginSuccess && <ChatInputBar />}{" "}
      </div>
    );
  }
}

class ChatInputBar extends React.Component {
  constructor(props) {
    super(props);
    this.timer = null;
    this.state = {
      text: "",
      typing: false,
      inputID: "chat-input",
      buttonID: "chat-submit",
      formID: "chat-form",
      timer: null
    };
  }

  getState() {
    return this.state;
  }

  handleOnChange(e) {
    //Clear The Previous Timeout
    this.setState(prevState => {
      clearTimeout(this.state.timer);
    });
    this.setState({ typing: true, text: e.target.value, input: e.target });
    //Emit Store Typing Event
    ChatStore.setTyping(true);
    //Clear Time Out
    clearTimeout(this.timer);
    //Not Typing after 1sec of in-activity!
    this.timer = setTimeout(() => {
      this.setState({ typing: false });
      ChatStore.setTyping(false);
    }, 1000); ///< Change State After One Second of IDLE
  }

  handleSubmit(e) {
    e.preventDefault();

    //Store Message
    ChatStore.addMessage(this.state.text);

    this.state.input.value = ""; ///< Empty Input Field
  }

  render() {
    return (
      <div id="chat-bar-container">
        <form
          id={this.state.formID}
          action=""
          onSubmit={this.handleSubmit.bind(this)}
        >
          <input
            id={this.state.inputID}
            className="form-control"
            type="text"
            placeholder="Type Your Message..."
            onChange={this.handleOnChange.bind(this)}
          />{" "}
          <button
            id={this.state.buttonID}
            type="submit"
            className="btn btn-success"
          >
            Send Message{" "}
          </button>{" "}
        </form>{" "}
      </div>
    );
  }
}

import {
  Menu,
  MenuItem,
  Button,
  MenuDivider,
  Popover,
  Position,
  EditableText,
  Intent,
  Alert,
  Label,
  Card,
  Icon,
  Input,
  Overlay
} from "@blueprintjs/core";

/** Chat and User Settings */
class ChatSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showSettings: false
    };
  }

  handlerSettingsInterraction() {
    //Show/Hide Popover
    this.setState({
      showSettings: !this.state.showSettings
    });
  }

  //User Logout
  logoutHandler() {
    this.props.triggerDisconnected();
  }

  render() {
    let settingsContent = (
      <div className="centered-container">
        <h5 className="align-center">Settings</h5>{" "}
        <div>
          <Label text="Logout of Chat" className="pt-label">
            {" "}
            <Button
              text="Logout"
              intent={Intent.DANGER}
              onClick={this.logoutHandler.bind(this)}
            />
          </Label>
        </div>
      </div>
    );

    const tetherOptions = {
      constraints: [
        {
          attachment: "together",
          to: "scrollParent"
        }
      ]
    };

    return (
      <div>
        {" "}
        {/*Main Container*/}{" "}
        <Popover
          content={settingsContent}
          isOpen={this.state.showSettings}
          onInteraction={this.handlerSettingsInterraction.bind(this)}
          position={Position.RIGHT_TOP}
          useSmartArrowPositioning={false}
          tetherOptions={tetherOptions}
        >
          <Button text="Settings" intent={Intent.PRIMARY} />
        </Popover>
        {/*Icon Triggerer*/}{" "}
      </div>
    );
  }
}

//Connected Users Component
function ConnectedUsers(props) {
  console.log("PROPS: ", props);
  return (
    <div className="users-container">
      <div className="bordered-header">Online</div>
      <div
        className="flex-container-vert"
        style={{ alignItems: "center", marginTop: "11px" }}
      >
        {!props.connected.length && <h5>No One is Online!</h5>}
        {props.connected.map((usr, idx) => {
          return <h5>{usr.username}</h5>;
        })}
      </div>
    </div>
  );
}

class UpdateUserDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = { username: "", password: "" };
  }

  update() {
    axios.post("http://localhost:3000/user/update", {username: this.state.username, password: this.state.password, oldUsername: ChatStore.getUsername()})
    .then((res) => {
      if(res.data.status == "success") {
        alert("User Data has been Successfully Changed!");
      } else if (res.data.status == "error") {
        alert("Cannot Change User Data! " + res.data.message);
      }
    }).catch((e) => {
      if(e) {
        alert("Cannot Update Data!");
        console.log(e);
      }
    })
  }

  render() {
    return (
      <Overlay
        isOpen={this.props.showUpdateUserDetails}
        canOutsideClickClose={true}
        onClose={() => this.props.toggleUpdateUserDatails(false)}
        className="update-user"
      >
        <div className="update-user-container">
          <div className="bordered-header">Update Details</div>
          <div>
            <div className="pt-form-group">
              <label htmlFor="username" className="pt-label">
                New Username
              </label>
              <div className="pt-form-content">
                <div className="pt-input-group">
                  <input
                    type="text"
                    className="pt-input"
                    placeholder="New Username"
                    className="pt-input"
                    onChange={e => this.setState({ username: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="pt-form-group">
              <label htmlFor="password" className="pt-label">
                New Password
              </label>
              <div className="pt-form-content">
                <div className="pt-input-group">
                  <input
                    type="password"
                    className="pt-input"
                    placeholder="New Password"
                    className="pt-input"
                    onChange={e => this.setState({ password: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              class="pt-button pt-intent-success"
              onClick={this.update.bind(this)}
            >
              Update
            </button>
          </div>
        </div>
      </Overlay>
    );
  }
}

//Side Area
class SideArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connectedUsers: []
    };
  }

  getConnectedUsers() {
    //Get Currently Connected Users on the Server
    axios
      .get("http://localhost:3000/user/connected")
      .then(res => {
        console.log("Connected Users ", res);
        if (res.data.status == "success" && res.status == 200) {
          //Success
          console.log("Connected Users : ", res.data.connectedUsers);
          this.setState(prevState => {
            let connected = [];
            for (let usr of res.data.connectedUsers) {
              console.log("Right Connected User: ", usr);
              if (usr.username != this.props.username) {
                //Add only Other Connected Users (Not Yourself!)
                connected.push(usr);
              }
            }
            return { connectedUsers: connected };
          });
        } else if (res.data.status == "error") {
          //Server Error
          alert("Cannot Get Connected Users, Server Error!");
          console.log(
            "Cannot Get Connected Users, Server Error, ",
            res.data.message
          );
        }
      })
      .catch(e => {
        if (e) {
          alert("Cannot Get Connected Users, Error Connecting to the Server!");
          console.log(
            "Cannot Get Connected Users, Error Connecting to the Server, ",
            e.message
          );
        }
      });
  }

  componentWillMount() {
    //Set a timeout for fetching Connected Users each 2 secs
    setInterval(this.getConnectedUsers.bind(this), 7200);
    this.getConnectedUsers();
  }

  render() {
    return (
      <div id="side-area" className="col-md-3 flex-grow flex-parent">
        <ConnectedUsers connected={this.state.connectedUsers} />
        <div className="user-settings">
          <Popover
            position={Position.RIGHT}
            isOpen={this.state.isSettingsOpen}
            content={
              <div className="settings-container">
                <div className="bordered-header">Settings</div>
                <div className="options-container">
                  <div className="option">
                    <a
                      href="#"
                      onClick={() => this.props.toggleUpdateUserDetails()}
                    >
                      Update Details
                    </a>
                  </div>
                  <div className="option">
                    <p>Sign Out of the Chat</p>
                    <button
                      type="button"
                      className="pt-button pt-intent-danger"
                      onClick={() => {}}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            }
          >
            <span
              className="fa fa-cog fa-2x"
              onClick={() => {
                this.setState(prevState => ({
                  isSettingsOpen: !prevState.isSettingsOpen
                }));
              }}
            />
          </Popover>
        </div>
      </div>
    );
  }
}

class ChatContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  handleRequestSend() {
    this.props.request.get(
      {
        uri: "http://localhost:3000/tasks",
        json: true
      },
      (err, httpRes, body) => {
        if (err) console.error("Send Request Error ", err);
        console.log(body);
      }
    );
  }

  handleNewMessage(e) {
    console.log("NEW MESSAGE ADDED TO THE DOM");
  }

  componentWillUpdate() {
    console.log("Updating Chat Container");
  }

  render() {
    //Check if typing
    let typing;
    //if(this.props.typing.state)
    console.log("Typing: 5", this.props.typing);
    if (this.props.typing.state)
      typing = this.props.typing.username + " is typing...";
    else typing = "";

    return (
      <div className="flex-container-horz flex-grow">
        {" "}
        {/*Side Area*/}
        <SideArea
          username={this.props.username}
          changeUsername={this.props.changeUsername}
          triggerDisconnected={this.props.triggerDisconnected}
          toggleUpdateUserDetails={this.props.toggleUpdateUserDetails}
        />{" "}
        {/*Main Area*/}{" "}
        <div
          id="main-area"
          className="col-md-9 flex-grow-3"
          onChange={this.handleNewMessage.bind(this)}
        >
          <ul className="messages-container-owner">
            {" "}
            {this.props.messages.map((msg, index) => {
              if (this.props.current == msg.username) {
                return (
                  <li className="message" key={index}>
                    {" "}
                    {"You - " + msg.message}{" "}
                  </li>
                );
              }
            })}{" "}
          </ul>{" "}
          <ul className="messages-container-sender">
            {" "}
            {this.props.messages.map((msg, index) => {
              if (this.props.current != msg.username) {
                return (
                  <li className="message" key={index}>
                    {" "}
                    {msg.username + " - " + msg.message}{" "}
                  </li>
                );
              }
            })}{" "}
            {typing != "" && <li>{typing}</li>}{" "}
          </ul>{" "}
        </div>{" "}
      </div>
    );
  }
}

class RegisterBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fullName: "",
      username: "",
      email: "",
      password: ""
    };
  }

  handleFullnameChange(e) {
    this.setState({ fullName: e.target.value });
  }

  /*On Change for Inputs*/
  handleUsernameChange(e) {
    this.setState({ username: e.target.value });
  }

  handleEmailChange(e) {
    this.setState({ email: e.target.value });
  }

  handlePasswordChange(e) {
    this.setState({ password: e.target.value });
  }

  handleRegisterSubmit(e) {
    //Email Verification REGEX Inputs Validation
    if (!this.state.fullName) {
      alert("Please Enter Your FullName");
      return false;
    }
    if (!this.state.username) {
      alert("Please Enter Your Username");
      return false;
    }
    if (!this.state.email) {
      alert("Please Enter Your Email");
      return false;
    }
    if (!checkEmail(this.state.email)) {
      alert("Please Enter A Valid Email Address!");
      return false;
    }
    if (!this.state.password) {
      alert("Please Enter Your Password");
      return false;
    }
    if (this.state.password.length < 8) {
      alert("Please Make Sure that your password is at least is length of 8");
      return false;
    }

    let formData = {
      fullName: this.state.fullName,
      username: this.state.username,
      email: this.state.email,
      password: this.state.password
    };

    console.log("FORM DATA: ", formData);

    //Send Register Request
    axios
      .post("http://localhost:3000/user/register", formData)
      .then(res => {
        if (res.data == "success" && res.status == 200) {
          //Success
          alert("User Registered Successfully!");
        } else if (res.data.status == "error") {
          alert("Error, Cannot Register User, Please Try Again!");
        }
      })
      .catch(e => {
        if (e) {
          alert("Error Registering User!");
          console.log("User Registration EROROR: ", e);
        }
      });
  }

  render() {
    return (
      <div className="login-box">
        <div className="login-box-container">
          <h3 className="text-center">Register To The Chat</h3>{" "}
          <div className="form-group">
            <label htmlFor="registerFullname">FullName</label>{" "}
            <input
              type="text"
              name="registerFullname"
              className="form-control"
              onChange={this.handleFullnameChange.bind(this)}
              ref={fullNameInput => (this.fullNameInput = fullNameInput)}
              placeholder="Full Name"
            />{" "}
          </div>{" "}
          <div className="form-group">
            <label htmlFor="registerUsername">UserName</label>{" "}
            <input
              type="text"
              name="registerUsername"
              className="form-control"
              onChange={this.handleUsernameChange.bind(this)}
              ref={usrnameInput => (this.usrnameInput = usrnameInput)}
              placeholder="Username"
            />{" "}
          </div>{" "}
          <div className="form-group">
            <label htmlFor="registerEmail">Email</label>{" "}
            <input
              type="text"
              name="registerEmail"
              className="form-control"
              onChange={this.handleEmailChange.bind(this)}
              ref={emailInput => (this.emailInput = emailInput)}
              placeholder="Email"
            />{" "}
          </div>{" "}
          <div className="form-group">
            <label htmlFor="registerPassword">Password</label>{" "}
            <input
              type="Password"
              name="registerPassword"
              className="form-control"
              onChange={this.handlePasswordChange.bind(this)}
              ref={passInput => (this.passInput = passInput)}
              placeholder="Password"
            />{" "}
          </div>{" "}
          <button
            type="submit"
            className="btn btn-success btn-block"
            onClick={this.handleRegisterSubmit.bind(this)}
          >
            Register{" "}
          </button>{" "}
          <a href="#" onClick={this.props.handleLoginClick}>
            Already a Member, Login
          </a>{" "}
        </div>{" "}
      </div>
    );
  }
}

class LoginBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      url: "http://localhost:3000",
      token: "NO_TOKEN",
      isOpen: this.props.isOpen,
      showLoginError: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isOpen != this.state.isOpen) {
      this.setState({ isOpen: nextProps.isOpen });
    }
  }

  getUsername() {
    return this.state.email;
  }

  getPassword() {
    return this.state.password;
  }

  handleEmailChange(e) {
    this.setState({ email: e.target.value });
  }

  handlePasswordChange(e) {
    this.setState({ password: e.target.value });
  }

  handleLoginSubmit(e) {
    console.log(this.state);

    if (!this.state.email) {
      alert("Please Enter a Valid Email!");
      return false;
    } else if (!this.state.password) {
      alert("Please Enter Your Password");
      return false;
    }

    //User Credentials
    let formData = {
      email: this.state.email,
      password: this.state.password
    };

    //Login Request
    axios
      .post("http://localhost:3000/user/login", formData)
      .then(res => {
        console.log("LOGIN ", res);
        if (res.data.status == "success" && res.status == 200) {
          //Success
          alert("Welcome Back!");
        } else if (res.data.status == "error") {
          //Error
          return alert("Error Login User, " + res.data.message);
        }
        //Set Token on App State
        this.setState({ token: res.data.token, showLoginError: false });

        //Set Default HTTP Headers (Next Request with JWT Token)
        axios.defaults.headers.common["Authentication"] =
          "JWT " + res.data.token;

        //Setup AUTH Cookie
        this.setupAuthCookie();

        //Username and Password OK
        console.log("Setting Chatstore Username ", this.state.email);
        ChatStore.init(this.state.email);

        //Hide Login Box
        this.setState({ isOpen: false });
      })
      .catch(e => {
        if (e) {
          alert("Error Connecting to the Server!");
          console.log("Error Connecting to the Server ", e.message);
        }
      });

    //Empty the Fileds (Better User Experience)
    if (this.emailInput) this.emailInput.value = "";
    if (this.passInput) this.passInput.value = "";
  }

  //Hide Login Box
  hideBox() {
    //NOT USED!
    //Access DOM Element's Classes and Add Hidden Class to the Array
    this.login_box.classList.add("hidden");
  }

  //Set JWT Auth and Username Cookies For The Current Session
  setupAuthCookie() {
    //When there is no Token, Discard Cookies (No Successfull login!)
    if (!this.state.token) {
      console.error("Cannot Set Cookie, Auth Token Not Defined!");
      return false;
    }

    //Set JWT Token Cookie
    console.log("Setting JWT Cookie ", this.state.token);
    cookies.set(
      {
        url: "http://localhost",
        name: "JWToken",
        domain: "localhost",
        value: this.state.token
      },
      err => {
        if (err) console.log("Error Setting Auth Cookie ", err);
        else {
          //Set Username Cookie
          console.log("Setting Username COOKIE: ", this.state.email);
          cookies.set(
            {
              url: "http://localhost",
              name: "username",
              domain: "localhost",
              value: this.state.email
            },
            err => {
              if (err) console.log("Error Setting Cross-Session Username");
            }
          );
        }
      }
    );
  }

  authorizeUser() {
    //Set Default Headers
    return request.defaults({
      json: true,
      headers: {
        authorization: "JWT " + this.state.token
      }
    });
  }

  hideOverlay() {
    this.setState({ isOpen: false });
  }

  render() {
    return (
      this.state.isOpen && (
        <div
          className="login-box"
          ref={login_box => (this.login_box = login_box)}
        >
          <div className="login-box-container">
            {/* Login Failed */}
            <Alert
              isOpen={this.state.showLoginError}
              onConfirm={() => {
                this.setState({ showLoginError: false });
              }}
            >
              <h3 className="algin-center">
                Username or Password Does not Match! {this.errorMessage}{" "}
              </h3>
            </Alert>
            <h3 className="text-center">Login To The Chat Server!</h3>{" "}
            <div className="form-group">
              <label htmlFor="email">Username</label>
              <input
                name="email"
                type="text"
                className="form-control"
                onChange={this.handleEmailChange.bind(this)}
                ref={emailInput => (this.emailInput = emailInput)}
                placeholder="Email"
              />{" "}
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                name="password"
                type="password"
                className="form-control"
                onChange={this.handlePasswordChange.bind(this)}
                ref={passInput => (this.passInput = passInput)}
                placeholder="Password"
              />{" "}
            </div>
            <button
              type="button"
              className="btn btn-success btn-block"
              onClick={this.handleLoginSubmit.bind(this)}
            >
              Login{" "}
            </button>{" "}
            <a href="#" onClick={this.props.handleRegisterClick}>
              If you are New to the Team, Please Register{" "}
            </a>{" "}
          </div>{" "}
        </div>
      )
    );
  }
}

/*
//Simple Menu
const menu = new MenuElc();
menu.append(
  new MenuItemElc({
    label: "Label1",
    click() {
      console.log("You Clicked Label 1");
    },
    hover() {
      console.log("You are Hovered over the Label1");
    }
  })
);
window.addEventListener(
  "contextmenu",
  e => {
    e.preventDefault();
    menu.popup(remote.getCurrentWindow());
  },
  false
);

*/
