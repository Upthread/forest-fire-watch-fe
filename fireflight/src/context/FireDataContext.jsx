import React, { useReducer, createContext } from "react";
import axios from "axios";
import axiosWithAuth from "../utils/axiosWithAuth";
import { Marker } from "react-map-gl";
import { haversineDistance } from "../utils/haversineDistance";

import fireIcon from "../images/fireIcon.png";
import exclamationMark from "../images/exclaim.png";
import locationIcon from "../images/locationIcon.png";
import locationIconGreen from "../images/locationIconGreen.png";

import {
  GET_USER_LOCATIONS,
  GET_SELECTED_ADDRESS,
  GET_PUBLIC_COORDINATES,
  SET_PUBLIC_VIEWPORT,
  SET_TRIGGER_REGISTRATION_BUTTON,
  SET_ALL_FIRES,
  SET_SELECTED_MARKER,
  SET_SAVED_LOCATION,
  DELETE_LOCATION_MARKER,
  SET_USER_LOCATIONS
} from "./fireDataTypes";

const DSbaseURL = "https://fire-data-api.herokuapp.com";

const token =
  process.env.REACT_APP_MAPBOX_TOKEN ||
  "pk.eyJ1Ijoia2VuMTI4NiIsImEiOiJjanpuMXdlb2UwZzlkM2JsY2t2aTVkcGFoIn0.eGKKY2f3oC5s8GqsyB70Yg";

const fireDataReducer = (state, action) => {
  switch (action.type) {
    case GET_USER_LOCATIONS:
      return {
        ...state,
        userLocations: action.payload
      };
    case GET_SELECTED_ADDRESS:
      return {
        ...state,
        addresses: action.payload
      };
    case GET_PUBLIC_COORDINATES:
      return {
        ...state,
        publicCoordinates: action.payload[0],
        publicCoordinatesMarker: action.payload[1],
        localFireMarkers: action.payload[2]
      };
    case SET_PUBLIC_VIEWPORT:
      return {
        ...state,
        publicMapViewport: action.payload
      };
    case SET_TRIGGER_REGISTRATION_BUTTON:
      return {
        ...state,
        triggerRegistrationButton: action.payload
      };
    case SET_ALL_FIRES:
      return {
        ...state,
        allFires: action.payload[0],
        allFireMarkers: action.payload[1]
      };
    case SET_SELECTED_MARKER:
      return {
        ...state,
        selectedMarker: action.payload
      };
    case SET_SAVED_LOCATION: // FINISH THIS //
      return {
        ...state,
        selectedMarker: [],
        userLocationMarkers: action.payload
      };
    case DELETE_LOCATION_MARKER:
      return {
        ...state,
        publicCoordinatesMarker: [],
        selectedMarker: []
      };
    case SET_USER_LOCATIONS:
      return {
        ...state,
        userLocationMarkers: action.payload[0],
        userLocalFireMarkers: action.payload[1]
      };

    default:
      return {
        ...state
      };
  }
};

export const FireDataContext = createContext();

export const FireDataProvider = ({ children }) => {
  const [fireDataState, dispatch] = useReducer(fireDataReducer, {
    userLocations: [],
    addresses: [],
    publicCoordinates: {},
    publicCoordinatesMarker: [],
    publicRadius: 500,
    userCoordinates: [],
    publicMapData: {},
    publicMapViewport: {
      width: "100%",
      height: "100vh",
      latitude: 39.8283,
      longitude: -98.5795,
      zoom: 3.3
    },
    privateMapData: {},
    privateMapViewport: {
      width: "100%",
      height: window.innerWidth < 900 ? 350 : 500,
      latitude: 37.7749,
      longitude: -122.4194,
      zoom: 7
    },
    triggerRegistrationButton: false,
    alertData: [],
    alertViewed: false,
    showAlert: false,
    allFires: [],
    allFireMarkers: [],
    localFires: [],
    localFireMarkers: [],
    selectedMarker: [],
    selectedMarkerAddress: [],
    userLocationMarkers: [],
    userLocalFireMarkers: []
  });

  const getAllFires = () => {
    axios
      .get(`${DSbaseURL}/all_fires`)
      .then(res => {
        const localArray = res.data.Fires.map((fire, index) => (
          <Marker latitude={fire[1]} longitude={fire[0]} key={fire[0] + index}>
            <img
              src={fireIcon}
              height="35"
              width="35"
              style={{ zIndex: 3, transform: "translate(-17.5px, -35px)" }}
              alt=""
              onClick={e => {
                dispatch({
                  type: SET_SELECTED_MARKER,
                  payload: [fire[1], fire[0], null, null, "fireLocation"]
                });
              }}
            />
          </Marker>
        ));
        dispatch({
          type: SET_ALL_FIRES,
          payload: [res.data.Fires, localArray]
        });
      })
      .catch(err => {
        console.log(err);
      });
  };

  const deleteLocationMarker = () => {
    dispatch({
      type: DELETE_LOCATION_MARKER
    });
  };

  const saveLocationMarker = () => {
    const theToken = localStorage.getItem("token");

    if (theToken) {
      console.log(fireDataState.selectedMarker);
      axiosWithAuth()
        .post("locations", {
          address: fireDataState.selectedMarker[2],
          radius: fireDataState.selectedMarker[3]
        })
        .then(res => {
          dispatch({
            type: SET_SAVED_LOCATION,
            payload: [
              ...fireDataState.userLocationMarkers,
              <Marker
                latitude={fireDataState.selectedMarker[0]}
                longitude={fireDataState.selectedMarker[1]}
                key={`greenMarker${fireDataState.selectedMarker[0]}`}
              >
                <img
                  src={locationIconGreen}
                  height="35"
                  width="20"
                  style={{ zIndex: 5, transform: "translate(-17.5px, -35px)" }}
                  alt=""
                  onClick={e => {
                    dispatch({
                      type: SET_SELECTED_MARKER,
                      payload: [
                        fireDataState.selectedMarker[0],
                        fireDataState.selectedMarker[1],
                        fireDataState.selectedMarker[2],
                        fireDataState.selectedMarker[3],
                        "savedLocation"
                      ]
                    });
                  }}
                />
              </Marker>
            ]
          });
        });
    } else {
      alert("Please log in to save a location.");
    }
  };

  const getCoordinates = (address, radius) => {
    if (address) {
      axios
        .get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${token}`
        )
        .then(res => {
          let localArray = [];

          fireDataState.allFires.forEach(fire => {
            let distance = haversineDistance(
              [res.data.features[0].center[1], res.data.features[0].center[0]],
              [fire[1], fire[0]],
              true
            );

            if (distance <= radius) {
              localArray.push(fire);
            }
          });

          const localMarkers = localArray.map((fire, index) => (
            <Marker
              latitude={fire[1]}
              longitude={fire[0]}
              key={"localMarker" + fire[0] + index}
            >
              <img
                src={exclamationMark}
                height="25"
                width="35"
                style={{ zIndex: 3, transform: "translate(-17.5px, -52px)" }}
                alt=""
              />
            </Marker>
          ));

          dispatch({
            type: GET_PUBLIC_COORDINATES,
            payload: [
              {
                latitude: res.data.features[0].center[1],
                longitude: res.data.features[0].center[0]
              },
              <Marker
                latitude={res.data.features[0].center[1]}
                longitude={res.data.features[0].center[0]}
              >
                <img
                  src={locationIcon}
                  height="35"
                  width="20"
                  style={{ zIndex: 5, transform: "translate(-17.5px, -35px)" }}
                  alt=""
                  onClick={e => {
                    dispatch({
                      type: SET_SELECTED_MARKER,
                      payload: [
                        res.data.features[0].center[1],
                        res.data.features[0].center[0],
                        address,
                        radius,
                        "tempLocation"
                      ]
                    });
                  }}
                />
              </Marker>,
              localMarkers
            ]
          });
        });
    }
  };

  const getUserLocations = () => {
    axiosWithAuth()
      .get("locations")
      .then(res => {
        dispatch({
          type: GET_USER_LOCATIONS,
          payload: res.data
        });
      });
  };

  const setUserLocations = () => {
    axiosWithAuth()
      .get("locations")
      .then(res => {
        let localArray = [];
        res.data.forEach(loc => {
          fireDataState.allFires.forEach(fire => {
            let distance = haversineDistance(
              [loc.latitude, loc.longitude],
              [fire[1], fire[0]],
              true
            );
            if (distance <= loc.radius) {
              localArray.push(fire);
            }
          });
        });
        const localMarkers = localArray.map((fire, index) => (
          <Marker
            latitude={fire[1]}
            longitude={fire[0]}
            key={"localMarker" + fire[0] + index}
          >
            <img
              src={exclamationMark}
              height="25"
              width="35"
              style={{ zIndex: 3, transform: "translate(-17.5px, -52px)" }}
              alt=""
            />
          </Marker>
        ));
        const userLocs = res.data.map((uLoc, index) => (
          <Marker
            latitude={uLoc.latitude}
            longitude={uLoc.longitude}
            key={`greenMarker${index}${uLoc.latitude}`}
          >
            <img
              src={locationIconGreen}
              height="35"
              width="20"
              style={{ zIndex: 5, transform: "translate(-17.5px, -35px)" }}
              alt=""
              onClick={e => {
                dispatch({
                  type: SET_SELECTED_MARKER,
                  payload: [
                    uLoc.latitude,
                    uLoc.longitude,
                    uLoc.address,
                    uLoc.radius,
                    "savedLocation"
                  ]
                });
              }}
            />
          </Marker>
        ));
        dispatch({
          type: SET_USER_LOCATIONS,
          payload: [userLocs, localMarkers]
        });
      });
  };

  const setSelectedMarker = () => {
    dispatch({
      type: SET_SELECTED_MARKER,
      payload: []
    });
  };

  const setPublicViewport = viewport => {
    dispatch({
      type: SET_PUBLIC_VIEWPORT,
      payload: viewport
    });
  };

  const setTriggerRegistrationButton = () => {
    if (!localStorage.getItem("token")) {
      if (fireDataState.triggerRegistrationButton === false) {
        setTimeout(() => {
          dispatch({
            type: SET_TRIGGER_REGISTRATION_BUTTON,
            payload: true
          });
        }, 5000);
      }
    }
  };

  return (
    <FireDataContext.Provider
      value={{
        fireDataState,
        dispatch,
        getUserLocations,
        getCoordinates,
        setPublicViewport,
        setTriggerRegistrationButton,
        getAllFires,
        setSelectedMarker,
        deleteLocationMarker,
        saveLocationMarker,
        setUserLocations
      }}
    >
      {children}
    </FireDataContext.Provider>
  );
};