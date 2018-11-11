import React, { Component } from 'react';
import ModalImage from 'react-modal-image';
import {
  Drawer,
  Icon,
  Button,
  Modal,
  Popconfirm,
  message as Message,
} from 'antd';
import moment from 'moment-timezone';
import AddToCalendar from 'react-add-to-calendar';
import Map from '../../../../Component/MapDirection';
import firebase from '../../../../Config/firebase';

const Meetings = firebase.firestore().collection('Meetings');

export default class AcceptedDrawer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      coords: {},
      destination: {},
      mapVisible: false,
    };
  }

  closeMap = () => {
    this.setState({ mapVisible: false }, this.close());
  };

  showDirection = (place, origin) => {
    const {
      coords: { latitude, longitude },
    } = place;

    const destination = { latitude, longitude };
    this.setState(
      { coords: origin, destination, mapVisible: true },
      this.close(),
    );
  };

  close = () => {
    const { close } = this.props;
    close('ACCEPTED');
  };

  cancelMeeting = meetingID => {
    const me = localStorage.getItem('uid');

    Meetings.doc(meetingID)
      .update({
        cancelledBy: me,
        notification: me,
        status: 'cancelled',
      })
      .then(() => {
        Message.success('Meeting Cancelled');
        this.close();
      })
      .catch(err => Message.error(err.message));
  };

  markNotificationSeen = meetingID => {
    Meetings.doc(meetingID)
      .update({ notification: firebase.firestore.FieldValue.delete() })
      .catch(err => Message.error(err.message));
  };

  render() {
    const { mapVisible, destination, coords } = this.state;
    const { visible, data } = this.props;
    const me = localStorage.getItem('uid');

    let theAvatar;
    let theName;

    return (
      <Drawer
        title="Accepted Meetings"
        placement="right"
        closable
        onClose={() => this.close()}
        visible={visible}
        width="100%"
      >
        {data.length > 0 ? (
          data.map(item => {
            if (item.setBy.id === me) {
              const { avatar } = item.setWith;
              const { name } = item.setWith;
              theAvatar = avatar;
              theName = name;
            } else {
              const { avatar } = item.setBy;
              const { name } = item.setBy;
              theAvatar = avatar;
              theName = name;
            }

            return (
              <div className="data-card" key={item.id}>
                <div className="data">
                  <ModalImage
                    className="img"
                    small={theAvatar}
                    medium={theAvatar}
                    alt={theName}
                  />
                  <span className="name">{theName}</span>
                  <span className="place">
                    <Icon type="home" /> {item.place.name}
                  </span>
                  <span className="time">
                    {item.date} (<b>{item.time}</b>)
                  </span>
                  <span className="info">
                    Set by {item.setBy.id === me ? 'me' : theName}
                  </span>
                </div>
                {item.notification &&
                  item.notification.by !== me && (
                    <div className="notification success">
                      <p>Meeting accepted by {theName}</p>
                      <Button
                        className="notification-close-btn"
                        shape="circle"
                        icon="close"
                        size="small"
                        type="danger"
                        onClick={() => this.markNotificationSeen(item.id)}
                      />
                    </div>
                  )}
                <div className="actions">
                  <Button
                    className="btn"
                    onClick={() =>
                      this.showDirection(item.place, item.setWith.coords)
                    }
                  >
                    Show Map
                  </Button>
                  <AddToCalendar
                    className="add-to-calender-btn"
                    displayItemIcons={false}
                    buttonLabel="Add to Calender"
                    event={{
                      description: `Have a meeting with ${theName} created with MEETLO APP! at ${
                        item.place.name
                      }`,
                      location: `${item.place.name} ${item.place.address}`,
                      startTime: `${moment(
                        `${item.date} ${item.time}`,
                        'DD-MM-YYYY hh:mm A',
                      ).format()}`,
                      title: `Meeting with ${theName}`,
                    }}
                  />
                  <Popconfirm
                    title={`Cancel meeting with ${theName}?`}
                    onConfirm={() => this.cancelMeeting(item.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button className="btn" type="danger">
                      Cancel Meeting
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            );
          })
        ) : (
          <div
            className="data-card"
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <h3>No Data</h3>
          </div>
        )}
        <Modal
          style={{ top: 10 }}
          visible={mapVisible}
          onCancel={this.closeMap}
          footer={[
            <Button key="back" onClick={this.closeMap}>
              Close
            </Button>,
          ]}
        >
          <Map origin={coords} destination={destination} />
        </Modal>
      </Drawer>
    );
  }
}

/* eslint react/prop-types: 0 */
