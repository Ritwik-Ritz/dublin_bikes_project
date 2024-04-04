from flask import Flask, jsonify, render_template, request
import mysql.connector
import pickle
import pandas as pd 
import predict

app = Flask(__name__)

# Database configuration
DATABASE_CONFIG = {
    'user': 'root',
    'password': '', #INSERT YOUR OWN MYSQL WORKBENCH PASSWORD HERE
    'host': '127.0.0.1',
    'port': 3306,
    'database': 'dublinbikesgroup20',
}

# Function to connect to the database
def connect_db():
    return mysql.connector.connect(**DATABASE_CONFIG)

# API route to retrieve stations data
@app.route('/')
def get_data():
    try:
        # Connect to the MySQL database
        db = connect_db()

        # Create a cursor object to execute SQL queries
        cur = db.cursor()

        # Execute the query to select all stations
        cur.execute('SELECT * FROM station')

        # Fetch all the results
        stations = cur.fetchall()

        # Close the cursor and database connection
        cur.close()
        db.close()

        # Convert the data to a list of dictionaries
        # Each dictionary represents a station
        stations_list = []
        for station in stations:
            station_dict = {
                'number': station[0],
                'address': station[1],
                'banking': station[2],
                'bike_stands': station[3],
                'name': station[4],
                'position_lat': station[5],
                'position_lng': station[6],
            }
            stations_list.append(station_dict)

        # Return the stations data as JSON
        #return jsonify({'stations': stations_list})

        # Connect to the MySQL database
        db = connect_db()

        # Create a cursor object to execute SQL queries
        cur = db.cursor()

        # Execute the query to select all weather
        cur.execute('SELECT * FROM weather_data ORDER BY id DESC LIMIT 1;')

        # Fetch all the results
        weather = cur.fetchall()
        cur.close()
        db.close()

        temp=weather[0][1] 
        cond=weather[0][2] 
        ws=weather[0][3]
        wd=weather[0][4]
        prec=weather[0][5]
        # Close the cursor and database connection
        return render_template('index.html', temp=temp, condition=cond, speed=ws, direction=wd, rain=prec, stations=stations_list )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# API route to retrieve availability data
@app.route('/occupancy/<stationid>') # id of station needs to be included here
def get_occupancy(stationid):
    try:
        # Connect to the MySQL database
        db = connect_db()

        # Create a cursor object to execute SQL queries
        cur = db.cursor()

        id = stationid #for testing purposes. In final version expecting value to be passed in with the route call

        # Execute the query to select all occupancy
        cur.execute('SELECT available_bikes FROM availability where number = {} LIMIT 1;'.format(id)) 

        # Fetch all the results
        occupancy = cur.fetchall()

        # Close the cursor and database connection
        cur.close()
        db.close()

        return jsonify({'occupancy': occupancy}) 

    except Exception as e:
        return jsonify({'error': str(e)}), 500
  

# #API route for ML model 
# @app.route('/MLModel/<stationid>') # id of station needs to be included here
# def get_occupancy(stationid):
#     try:
#         # Connect to the MySQL database
#         db = connect_db()

#         # Create a cursor object to execute SQL queries
#         cur = db.cursor()

#         id = stationid #for testing purposes. In final version expecting value to be passed in with the route call

#         # Execute the query to select all occupancy
#         cur.execute('SELECT available_bikes FROM availability where number = {};'.format(id)) 

#         # Fetch all the results
#         occupancy = cur.fetchall()

#         cur.execute('SELECT * FROM weather_data;')

#         # Fetch all the results
#         weather = cur.fetchall()


#         # Close the cursor and database connection
#         cur.close()
#         db.close()

#         availabilityhistory_list = []
#         for occ in occupancy:
#             availability_dict = {
#                 'available_bikes': occ[0],
#             }
#             availabilityhistory_list.append(availability_dict)

#         weatherhistory_list = []
#         for cond in weather:
#             weather_dict = {
#                 'name': cond[0],
#                 'temp_c': cond[1],
#                 'weather_conditions': cond[2],
#                 'wind_mph': cond[3],
#                 'wind_dir': cond[4],
#                 'precip_mm': cond[5],
#                 'ID': cond[6],
#                 'last_updated': cond[7],
#             }
#             weatherhistory_list.append(weather_dict)
#         return jsonify({'availabilty': availabilityhistory_list}, {'weather': weatherhistory_list})

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500





@app.route('/predict', methods = ['POST']) # id of station needs to be included here

def predictAvailability(stationid):
    data = request.get_json()
    stationid = 1 
    # stationid = data.get('stationid') #TODO need to use input somehow here 
    temp_c = float(data.get('temp_c', 0))
    wind_mph = float(data.get('wind_mph', 0))
    precip_mm = float(data.get('precip_mm', 0))
    hours = float(data.get('hours', 0)) #TODO need to use input somehow here too 

    predicted_bikes = predict.predict(stationid, temp_c, wind_mph, precip_mm, hours)
    return jsonify({'predicted_bikes': predicted_bikes})


if __name__ == '__main__':
    app.run(debug=True)