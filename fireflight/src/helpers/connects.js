import axios from 'axios'
import stats from './status.js'

class connector{
    /**
     * This class is built as a helper to deal with all connection requests.
     */
    constructor(){
        this.connector=axios;
        if(process.env.NODE_ENV==='production')
            this.coreString='https://fireflight-lambda.herokuapp.com/api/'//http here
        else
            this.coreString='http://localhost:5000/api/'
        this.fireflight=process.env.REACT_APP_FIREFLIGHT;
        if(localStorage.getItem('token')!=null)
            this.connector.defaults.headers.common['Authorization']=localStorage.getItem('token')
        this.user=null
    }

    /**
     * Attempts to login to the application, passes a token to axios upon request. 
     * Sends a status with stats:true upon succes, and stats:false upon failure. Message will contain reason
     * @param {username:String, password:string} creds, Credentials to test against
     */
    async login(creds){

        let res = await axios.post(this.coreString+"auth/login",creds)

        let data = await res.data;


        if(res.status==200){//success test
            localStorage.setItem('token',data.token)
            this.connector.defaults.headers.common['Authorization']=data.token
            let who = await this.self()
            return stats(true,who.username);
        }else{
            //success failed
            
            throw {status:false,data:"Login Failed"}
        }
    }

    /**
     * Destroyed stored authorization token and removes the token from storage
     */
    logout(){
        this.connector.defaults.headers.common['Authorization']=null
        localStorage.removeItem('token')
    }
    

    /**
     * returns user object
     */
    async self(){
        let response = await axios.get(`${this.coreString}users/session`)
        let data = await response.data;
        return data;
    }

    /**
     * Registers a user with given credentials
     * Returns a status with {stats:true} upon success, and {stats:false} upon failure.
     * @param {username,password} creds Creditals wanted to register
     */
    async register(creds){
        let response = await axios.post(`${this.coreString}auth/register`,creds)
        if(response.status==201){
            let data = await response.data;
            this.connector.defaults.headers.common['Authorization']=data.token;
            localStorage.setItem('token',data.token)
            let who = await this.self();
            
            return new stats(true,{username:who.username})
        }else{
            let errors = {code:response.status}
            errors.message=response.data.message
            return new stats(false,errors)
        }
    } 

    async fetchLocations(){
        let response = await axios.get(`${this.coreString}locations`)
        let data = await response.data;
        if(response.status==200){
            return new stats(true,data)
        }
        else{
            return new stats(false,data)
        }
    }
}

const connect = new connector();

export default connect;