# CTRL F - search
''' 
City function
- show_all_cities()
- show_one_city(city_id)
- create_new_city()
- update_city(city_id)
- delete_city(city_id)

Place function
- show_all_places
- show_one_place
- add_new_place
- update_place
- delete_place
- update_place_status

Review function
- show_all_reviews
- show_one_review
- add_new_review
- update_review
- delete_review
- update_place_rating
'''

from flask import Flask, request, jsonify, make_response
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from pymongo import ASCENDING, DESCENDING
import jwt
import datetime
from functools import wraps
import bcrypt
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'secretKey' # Key for jwt

''''''
# MongoDB Connection
''''''
client = MongoClient("mongodb://127.0.0.1:27017")
db = client.foodPlacesDB # Database
businesses = db.foodPlaces # Collection
users = db.users
blacklist = db.blacklist

''''''
# Helpers
''''''
# Convert ObjectId fields to strings for JSON
def convert_objectid_to_str(document):
    if isinstance(document, list):  # If it's a list, process each item
        return [convert_objectid_to_str(item) for item in document]
    elif isinstance(document, dict):  # If it's a dict, process each key-value pair
        return {
            key: convert_objectid_to_str(value) if isinstance(value, (dict, list)) else str(value) if isinstance(value, ObjectId) else value
            for key, value in document.items()
        }
    else:
        return document  # Return the original value if not a dict or list

# Calculates the pagination
def calculate_pagination(total_items, page_size, page_num): 
    return {
        "current_page": page_num,
        "total_pages": (total_items + page_size - 1) // page_size,
        "page_size": page_size,
        "total_items": total_items
    }

''''''
# Validation functions
''''''
#For ObjectID    
def is_valid_objectid(id):
    # Checks if ID length is 24
    if len(id) != 24: # If ID length is equal to 24
        return False

    #Checks if all characters are hexadecimal
    hex_digits =  "0123456789abcdefABCDEF" #String of hexadecimal characters
    
    for char in id: #Iterates over each character in the ID
        if char not in hex_digits: #Checks if the character is not in the 'hex_digits' list
            return False #Returns False if any character is not a hexadecimal
    return True #Returns True if the ID is valid

# For place data
def validate_place_data(data):
    if not isinstance(data, dict):
        return False, "Invalid data format" 
    # Validate info section (most critical)
    if 'info' not in data or not isinstance(data['info'], dict):
        return False, "Missing or invalid info section"
        
    info = data['info']
    
    # Required fields
    if 'name' not in info or not isinstance(info['name'], str) or not info['name'].strip():
        return False, "Missing or invalid name"
    if 'type' not in info or not isinstance(info['type'], list) or not info['type']:
        return False, "Missing or invalid type"
    # Validates status if present
    if 'status' in info and info['status'] not in ['open', 'closed', 'temporary_closed']:
        return False, "Invalid status value"
    # Validates coordinates if present (critical for mapping)
    if 'location' in data and 'coordinates' in data['location']:
        coords = data['location']['coordinates']
        try:
            lat = float(coords.get('latitude', 0))
            lng = float(coords.get('longitude', 0))
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                return False, "Invalid coordinates"
        except (ValueError, TypeError):
            return False, "Invalid coordinate format"

    return True, None

# For pagination
def validate_pagination_params(page_num, page_size):
    try:
        # Set defaults if None
        if page_num is None:
            page_num = 1
        if page_size is None:
            page_size = 10
            
        # Convert to integers
        page_num = int(page_num)
        page_size = int(page_size)
        
        # Validate ranges
        if page_num < 1:
            return 1, page_size
        if page_size < 1:
            return page_num, 10
        if page_size > 100:
            return page_num, 100
            
        return page_num, page_size
        
    except (ValueError, TypeError):
        return 1, 10
    
# For ratings
def validate_rating(rating_str): # Validates rating value
    try: # Try to validate rating
        rating = float(rating_str) # Convert rating to float
        if 0 <= rating <= 5: # Check if rating is in valid range
            return rating, None # Return valid rating and no error
        return None, "Rating must be between 0 and 5" # Return error if out of range
    except ValueError: # Handle conversion errors
        return None, "Rating must be a number" # Return error message
    
# For date format
def validate_date(date_str): # Validates date string format
    try: # Try to parse the date
        datetime.strptime(date_str, '%Y-%m-%d') # Check if date matches format
        return date_str, None 
    except ValueError: # Handle invalid date format
        return None, "Invalid date format. Use YYYY-MM-DD"

# For review data
def validate_review_data(data): # Validates review data from form or JSON
    try: # Try to validate data
        # Check if required fields exist
        if 'rating' not in data: # If rating is missing
            return None, "Rating is required" # Return error message
            
        if 'content' not in data: # If content is missing
            return None, "Review content is required" # Return error message
            
        if 'user_id' not in data: # If user ID is missing
            return None, "User ID is required" # Return error message
            
        # Validate rating
        valid_rating, error = validate_rating(str(data['rating'])) # Validate rating value
        if error: # If rating validation failed
            return None, error # Return error message
            
        # Validate visit date if provided
        if 'visit_date' in data and data['visit_date']: # If visit date exists
            valid_date, error = validate_date(data['visit_date']) # Validate date format
            if error: # If date validation failed
                return None, error # Return error message
            data['visit_date'] = valid_date # Use validated date
            
        # Create validated review data
        validated_data = { # Build validated data dictionary
            "rating": valid_rating, # Use validated rating
            "content": str(data['content']).strip(), # Clean content string
            "user_id": str(data['user_id']), # Convert user ID to string
            "visit_date": data.get('visit_date'), # Add visit date if exists
            "photos": data.get('photos', []), # Add photos if exist, empty list if not
            "tags": data.get('tags', []) # Add tags if exist, empty list if not
        }
        
        return validated_data, None # Return validated data and no error
        
    except Exception as e: # Handle any validation errors
        return None, f"Validation error: {str(e)}" # Return error message

''''''
# Decorators
''''''
def jwt_required(func): # Decorator for JWT validation
    @wraps(func)
    def jwt_required_wrapper(*args, **kwargs): # Wrapper function
        token = None # Initialize token variable
        
        # Check for token in headers
        if 'x-access-token' in request.headers: # If token in headers
            token = request.headers['x-access-token'] # Get token
        if not token: # If no token found
            return make_response(jsonify({"error": "Token is missing"}), 401)
            
        try: # Try to decode token
            data = jwt.decode( # Decode JWT token
                token, # Token to decode
                app.config['SECRET_KEY'], # Secret key
                algorithms=["HS256"] # Algorithm used
            )
            
            # Check if token is blacklisted
            bl_token = blacklist.find_one({"token": token}) # Check blacklist
            if bl_token is not None: # If token found in blacklist
                return make_response(jsonify({"error": "Token has been cancelled"}), 401)
                
        except: # If token invalid
            return make_response(jsonify({"error": "Token is invalid"}), 401)
        return func(*args, **kwargs) # Call original function

    return jwt_required_wrapper

def admin_required(func): # Decorator for admin validation
    @wraps(func)
    def admin_required_wrapper(*args, **kwargs): # Wrapper function
        token = request.headers['x-access-token'] # Get token
        data = jwt.decode( # Decode token
            token, 
            app.config['SECRET_KEY'],
            algorithms=["HS256"]
        )
        if data["admin"]: # If user is admin
            return func(*args, **kwargs) # Call original function
        else: # If user not admin
            return make_response(jsonify({"error": "Admin access required"}), 401)
    return admin_required_wrapper

''''''
# Authentication routes
''''''
@app.route("/api/register", methods=['POST'])
def register():
    data = request.get_json()
    
    # Check if all required fields are present
    required_fields = ['username', 'password', 'email', 'name']
    if not all(field in data for field in required_fields):
        return make_response(jsonify({'message': 'Missing required fields. Required fields are: username, password, email, and name'}), 400)

    # Check if username already exists
    if users.find_one({'username': data['username']}):
        return make_response(jsonify({'message': 'Username already exists'}), 409)
    
    # Check if email already exists
    if users.find_one({'email': data['email']}):
        return make_response(jsonify({'message': 'Email already registered'}), 409)
    
    # Validate password length
    if len(data['password']) < 6:
        return make_response(jsonify({'message': 'Password must be at least 6 characters long'}), 400)

    # Create new user
    new_user = {
        'name': data['name'],
        'username': data['username'],
        'email': data['email'],
        'password': bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()),
        'admin': data.get('admin', False),  # Default to False if not specified
        'created_at': datetime.datetime.now(datetime.UTC)
    }
    
    try:
        # Insert the new user
        users.insert_one(new_user)
        
        # Generate token for the new user
        token = jwt.encode({
            'user': new_user['username'],
            'admin': new_user['admin'],
            'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=30)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return make_response(jsonify({
            'message': 'Registration successful',
            'token': token,
            'username': new_user['username'],
            'email': new_user['email'],
            'name': new_user['name']
        }), 201)
        
    except Exception as e:
        return make_response(jsonify({
            'message': 'Error occurred while registering user',
            'error': str(e)
        }), 500)

# Login route
@app.route("/api/login", methods=['GET']) 
def login(): # Login function
    auth = request.authorization # Get auth info

    if auth: # If auth provided
        user = users.find_one({'username': auth.username}) # Find user
        
        if user: # If user found
            if bcrypt.checkpw( # Check password
                bytes(auth.password, 'UTF-8'), # Convert password to bytes
                user["password"] # Stored password hash
            ):
                token = jwt.encode( # Create JWT token
                    {
                        'user': auth.username, # Username
                        'admin': user['admin'], # Admin status
                        'exp': datetime.datetime.now(datetime.UTC) + # Expiry time
                               datetime.timedelta(minutes=30)
                    },
                    app.config['SECRET_KEY'], # Secret key
                    algorithm="HS256" # Algorithm
                )
                return make_response(jsonify({'token': token}), 200)
            else: # If password incorrect
                return make_response(jsonify({'error': 'Bad password'}), 401)
        else: # If user not found
            return make_response(jsonify({'error': 'Bad username'}), 401)
    return make_response(jsonify({'error': 'Authentication required'}), 401)

# Logout
@app.route("/api/logout", methods=["GET"])
#@jwt_required # Requires valid token
def logout(): # Logout function
    token = request.headers['x-access-token'] # Get token
    blacklist.insert_one({"token": token}) # Add to blacklist
    return make_response(jsonify({'message': 'Logout successful'}), 200)

''''''
# City routes
''''''
# Gets all cities with pagination, optional filtering, and sorting
@app.route("/api/cities", methods=["GET"]) # Route to cities, uses GET method
def show_all_cities(): # Function to show all cities
    try: # Try to handle potential errors
        # Get pagination parameters from request
        page_num, page_size = validate_pagination_params(
            request.args.get('pn'),
            request.args.get('ps')
        )
        # Calculate pagination starting point
        page_start = (page_num - 1) * page_size

        # Dictionary to store query filters
        query = {}  

        # Filters the database by city name if a 'name' parameter is provided in the query
        name = request.args.get('name') 
        if name: # Checks if a name filter is provided 
            query['city_name'] = {'$regex': name, '$options': 'i'} # Case-insensitive regex for name

        # Validates the sorting options
        valid_sort_fields = ['city_name'] 
        sort_field = request.args.get('sort_by', 'city_name') # Defaults to 'city_name'
        if sort_field not in valid_sort_fields: 
            sort_field = 'city_name'  # Default to 'city_name' if invalid
        
        # Determines the sorting and order fields
        sort_order = request.args.get('sort_order', 'asc')
        sort_direction = DESCENDING if sort_order.lower() == 'desc' else ASCENDING # Set sort based on the 'sort_order'
        
        # Counts the total cities matching the query for pagination purposes
        total_cities = businesses.count_documents(query) # Gets the total count of matching cities
        if total_cities == 0:
                return make_response(jsonify({"message": "No cities were found matching the criteria."}), 404)
        
        # Retrieve matching cities from the database with pagination and sorting
        cities_taken = businesses.find(query) \
            .sort(sort_field, sort_direction) \
            .skip(page_start) \
            .limit(page_size) # Applies sorting, pagination, and filters

        # Converts to a list and ObjectId fields to strings using the helper function
        data_to_return = [convert_objectid_to_str(city) for city in cities_taken]

        # Returns a 404 status code if no cities found
        if not data_to_return: # Checks if the data list is empty
            return make_response(jsonify({"message": "No cities were found matching the criteria."}), 404)

        # Returns the paginated results with city data as JSON response
        return make_response(jsonify({
            'cities': data_to_return, # List of cities with places and related data
            'pagination': { # Pagination information
                'current_page': page_num,
                'total_pages': (total_cities + page_size - 1) // page_size, # Calculates the total pages
                'page_size': page_size,
                'total_items': total_cities 
            }}), 200)

    except ValueError as value_err: # Handles invalid parameter values
        return make_response(jsonify({"message": "Invalid parameter value", "error": str(value_err)}), 400)
    except Exception as err: # Handles any other errors that occur
        print(f"Error occurred: {err}") 
        return make_response(jsonify({"message": f"Woopsies...: {str(err)}"}), 500)

# Gets a specific city by ID with filters
@app.route("/api/cities/<city_id>", methods=["GET"])
def show_one_city(city_id): 
    try: 
        # Validates the ObjectId format
        if not is_valid_objectid(city_id): # Check if ID format is valid
            return make_response(jsonify({ # Return error if invalid
                "error": "Invalid ObjectId format"
            }), 400)

        # Gets city from database
        city = businesses.find_one({"_id": ObjectId(city_id)}) # Find city by ID
        if not city: # If city not found
            return make_response(jsonify({ # Return error response
                "error": f"City with ID {city_id} not found"
            }), 404)

        # Processes ObjectId fields
        city = convert_objectid_to_str(city) # Convert ObjectIds to strings

        # Gets filter parameters
        include_places = request.args.get('include_places', 'false').lower() == 'true' # Whether to include places
        min_rating = float(request.args.get('min_rating', 0)) # Minimum rating filter
        max_rating = float(request.args.get('max_rating', 5)) # Maximum rating filter
        place_type = request.args.get('place_type') # Type of place filter

        # Returns basic city data if places not requested
        if not include_places: # If places not needed
            return make_response(jsonify({ # Return simple response
                'data': {
                    'city_id': city.get('city_id'), # City identifier
                    'city_name': city.get('city_name') # City name
                },
                'includes': {'places': False}, # Indicates no places included
                'filters_applied': None # No filters used
            }), 200)

        # Processes and filters places
        filtered_places = [] # Initialize filtered places list
        for place in city.get('places', []): # Loop through each place
            # Checks rating criteria
            rating = place.get('ratings', {}).get('average_rating') # Get place rating
            if rating is None or not (min_rating <= rating <= max_rating): # If rating doesn't match
                continue # Skip this place

            # Checks place type criteria
            if place_type and place_type.lower() not in [t.lower() for t in place.get('info', {}).get('type', [])]:
                continue # Skip if type doesn't match

            # Creates place data object
            place_data = { # Structure place information
                'place_id': place.get('place_id'), # Place identifier
                'info': place.get('info'), # Basic information
                'location': place.get('location'), # Address and coordinates
                'business_hours': place.get('business_hours'), # Operating hours
                'service_options': place.get('service_options'), # Available services
                'menu_options': place.get('menu_options'), # Menu details
                'amenities': place.get('amenities'), # Available amenities
                'ratings': { # Rating information
                    'average_rating': rating, # Overall rating
                    'review_count': place.get('ratings', {}).get('review_count'), # Number of reviews
                    'recent_reviews': place.get('ratings', {}).get('recent_reviews', []) # Latest reviews
                },
                'media': place.get('media') # Photos and media
            }
            filtered_places.append(place_data) # Add to filtered list

        # Returns complete response
        return make_response(jsonify({ # Create JSON response
            'data': { # Main data object
                'city_id': city.get('city_id'), # City identifier
                'city_name': city.get('city_name'), # City name
                'places': filtered_places # Filtered places list
            },
            'includes': {'places': True}, # Indicates places included
            'filters_applied': { # Applied filter values
                'min_rating': min_rating if min_rating > 0 else None, # Minimum rating if set
                'max_rating': max_rating if max_rating < 5 else None, # Maximum rating if set
                'place_type': place_type # Place type if specified
            }
        }), 200)

    except ValueError as err: # Handles value errors
        return make_response(jsonify({ # Return error response
            "error": "Invalid parameter value", # Error type
            "message": str(err) # Error details
        }), 400) # Bad request error

    except Exception as err: # Handles unexpected errors
        print(f"Error occurred: {err}") # Log the error
        return make_response(jsonify({ # Return error response
            "error": "Server error", # Error type
            "message": "An unexpected error occurred", # Error message
            "details": str(err) # Error details
        }), 500) # Server error response

# Creates a new city
@app.route("/api/cities", methods=["POST"])
#@jwt_required 
def create_new_city(): 
    try: 
        # Validates JSON request
        if not request.is_json: # Checks if request contains JSON
            return make_response(jsonify({"error": "Request must be JSON"}), 400) # Returns error if not JSON
        
        city_data = request.json # Gets JSON data from request

        # Validates required city fields
        required_fields = ["city_id", "city_name"] # List of required fields
        for field in required_fields: # Check each required field
            if field not in city_data or not city_data[field]: # If field missing or empty
                return make_response(jsonify({"error": f"Missing required field: {field}"}), 400) 

        # Creates city document structure
        city_document = { # Initialize city document
            "city_id": city_data["city_id"], # Set city ID
            "city_name": city_data["city_name"], # Set city name
            "places": [] # Empty places array
        }

        # Processes places if provided
        if "places" in city_data: # If places included in request
            for place in city_data["places"]: # Process each place
                # Validates required place fields
                if not all(key in place for key in ["place_id", "info", "location"]): # Check required fields
                    return make_response(jsonify({"error": "Each place must have place_id, info, and location fields"}), 400) # Return error if missing fields

                # Validates place info
                if not all(key in place["info"] for key in ["name", "type"]): # Check info fields
                    return make_response(jsonify({"error": "Each place info must have name and type fields"}), 400) 

                # Validates coordinates
                location = place.get("location", {}) # Get location data
                coords = location.get("coordinates", {}) # Get coordinates
                try: # Try to process coordinates
                    coords["latitude"] = float(coords.get("latitude", 0)) # Convert latitude to float
                    coords["longitude"] = float(coords.get("longitude", 0)) # Convert longitude to float
                except (ValueError, TypeError): # If conversion fails
                    return make_response(jsonify({"error": "Invalid coordinates format"}), 400) 

                # Creates clean place object
                clean_place = { # Initialize clean place structure
                    "place_id": place["place_id"], # Set place ID
                    "info": { # Set place info
                        "name": place["info"]["name"], # Place name
                        "type": place["info"]["type"], # Place types
                        "status": place["info"].get("status") # Status 
                    },
                    "location": place["location"], # Location details
                    "business_hours": place.get("business_hours", {}), # Hours if provided
                    "service_options": place.get("service_options", {}), # Services if provided
                    "menu_options": place.get("menu_options", {}), # Menu details if provided
                    "amenities": place.get("amenities", {}), # Amenities if provided
                    "ratings": { 
                        "average_rating": 0, # Default rating
                        "review_count": 0, # Default review count
                        "recent_reviews": [] # Empty reviews array
                    },
                    "media": {"photos": []} # Empty media array
                }

                # Processes ratings if provided
                if "ratings" in place: # If ratings included
                    ratings = place["ratings"] # Get ratings data
                    clean_place["ratings"]["average_rating"] = float(ratings.get("average_rating", 0)) # Set rating
                    clean_place["ratings"]["review_count"] = int(ratings.get("review_count", 0)) # Set count
                    clean_place["ratings"]["recent_reviews"] = ratings.get("recent_reviews", []) # Set reviews

                # Processes media if provided
                if "media" in place and "photos" in place["media"]: # If photos included
                    clean_place["media"]["photos"] = place["media"]["photos"] # Set photos

                city_document["places"].append(clean_place) # Add clean place to city

        # Inserts city into database
        result = businesses.insert_one(city_document) # Insert new city

        # Returns success response
        return make_response(jsonify({ # Create success response
            "message": "City created successfully", # Success message
            "city_id": str(result.inserted_id) # New city ID
        }), 200) # Created status code

    except Exception as err: # Handles unexpected errors
        print(f"Error occurred: {err}") # Log the error
        return make_response(jsonify({ # Return error response
            "error": "Server error", 
            "details": str(err)
        }), 500) # Server error status  

# Updates an existing city
@app.route("/api/cities/<city_id>", methods=["PUT"]) 
#@jwt_required
def update_city(city_id): 
    try: # Try to handle potential errors
        # Validates the ObjectId format
        if not is_valid_objectid(city_id): # Check if ID format is valid
            return make_response(jsonify({"error": "Invalid ObjectId format"}), 400)

        # Gets update data from request
        if not request.is_json: # If request isn't JSON
            return make_response(jsonify({"error": "Request must be JSON"}), 400)
        
        update_data = request.json # Get JSON data from request

        # Validates update data structure
        if not update_data: # If no update data provided
            return make_response(jsonify({"error": "No update data provided"}), 400)

        # Creates update document
        update_fields = {} # Initialize update fields

        # Updates basic city information
        if "city_name" in update_data: # If name update provided
            update_fields["city_name"] = update_data["city_name"] # Add name update

        # Updates places if provided
        if "places" in update_data: # If places update provided
            for place in update_data["places"]: # Process each place
                # Validates required place fields
                if "place_id" not in place: # If place_id missing
                    return make_response(jsonify({"error": "Each place must have place_id"}), 400)

                if "info" in place: # If info update provided
                    if not all(key in place["info"] for key in ["name", "type"]): # Check required info fields
                        return make_response(jsonify({"error": "Place info must have name and type fields"}), 400)

                # Validates coordinates if provided
                if "location" in place and "coordinates" in place["location"]: # If coordinates provided
                    try: # Try to process coordinates
                        coords = place["location"]["coordinates"] # Get coordinates
                        coords["latitude"] = float(coords.get("latitude", 0)) # Convert latitude
                        coords["longitude"] = float(coords.get("longitude", 0)) # Convert longitude
                    except (ValueError, TypeError): # If conversion fails
                        return make_response(jsonify({ "error": "Invalid coordinates format"}), 400)

            update_fields["places"] = update_data["places"] # Add places update

        # Checks if any valid updates provided
        if not update_fields: # If no valid updates
            return make_response(jsonify({"error": "No valid update fields provided"}), 400)

        # Updates city in database
        result = businesses.update_one( # Perform update
            {"_id": ObjectId(city_id)}, # Find city by ID
            {"$set": update_fields} # Set new values
        )

        # Checks update result
        if result.matched_count == 0: # If city not found
            return make_response(jsonify({"error": "City not found"}), 404)

        # Returns success response
        return make_response(jsonify({ # Return success response
            "message": "City updated successfully",
            "updated_fields": list(update_fields.keys())
        }), 200)

    except ValueError as err: # Handles value errors
        return make_response(jsonify({ # Return error response
            "error": "Invalid value in update data",
            "message": str(err)
        }), 400)

    except Exception as err: # Handles unexpected errors
        print(f"Error occurred: {err}") # Log the error
        return make_response(jsonify({ # Return error response
            "error": "Server error",
            "message": str(err)
        }), 500)

# Deletes a city
@app.route("/api/cities/<city_id>", methods=["DELETE"]) 
#@jwt_required
#@admin_required
def delete_city(city_id): 
    try:
        if not is_valid_objectid(city_id):
            return make_response(jsonify({"error": "Invalid ID format"}), 400)
        result = businesses.delete_one({"_id": ObjectId(city_id)}) # Delete city by ID
        
        # Check if city was found and deleted
        if result.deleted_count == 0: # If no document was deleted
            return make_response(jsonify({"error": "City not found"}), 404) 
        return make_response(jsonify({"message": "City deleted successfully"}), 200)    
        
    except Exception as err: # Handle any errors
        return make_response(jsonify({"error": str(err)}), 500)

''''''
# Place route
''''''
# Gets all food places within a city
@app.route("/api/cities/<city_id>/places", methods=["GET"]) 
def show_all_places(city_id): # Takes city_id as its parameter
    try: 
        if not ObjectId.is_valid(city_id): # Check if ID format is valid
            return make_response(jsonify({"error": "Invalid city ID"}), 200)
        
        # Gets pagination parameters
        page_num, page_size = validate_pagination_params( # Get and validate pagination
            request.args.get('pn'), # Page number from request
            request.args.get('ps') # Page size from request
        )
        page_start = (page_size * (page_num - 1)) # Calculate pagination start point
        
        # Sets up aggregation pipeline
        pipeline = [] # Initialize pipeline list
        pipeline.append({ # Add city matching stage
            "$match": {"_id": ObjectId(city_id)} # Find specific city
        })
        pipeline.append({ # Add places unwinding stage
            "$unwind": "$places" # Split places array
        })
        
        # Adds filters if provided
        match_conditions = [] # Initialize conditions list
        filters_applied = {} # Track all applied filters
        
        # Adds place type filter
        place_type = request.args.get('type') # Get type parameter
        if place_type: # If type provided
            match_conditions.append({ # Add type condition
                "places.info.type": place_type # Match place type
            })
            filters_applied['type'] = place_type # Track type filter
            
        # Adds rating filter
        min_rating = request.args.get('min_rating') # Get rating parameter
        if min_rating: # If rating provided
            try: # Try to convert rating
                min_rating_float = float(min_rating) # Convert to float
                match_conditions.append({ # Add rating condition
                    "places.ratings.average_rating": {
                        "$gte": min_rating_float # Match minimum rating
                    }
                })
                filters_applied['min_rating'] = min_rating_float # Track rating filter
            except ValueError: # If rating conversion fails
                return make_response(jsonify({ # Return error response
                    "error": "Invalid rating value"
                }), 400)
        
        # Sets up service filters
        service_filters = { # Define available service options
            'service_options': {
                'dining': {
                    'dine_in': 'service_options.dining.dine_in',
                    'takeaway': 'service_options.dining.takeaway',
                    'reservations': 'service_options.dining.reservations',
                    'outdoor_seating': 'service_options.dining.outdoor_seating',
                    'group_bookings': 'service_options.dining.group_bookings'
                },
                'meals': {
                    'breakfast': 'service_options.meals.breakfast',
                    'lunch': 'service_options.meals.lunch',
                    'dinner': 'service_options.meals.dinner',
                    'brunch': 'service_options.meals.brunch'
                }
            }
        }
        
        # Processes service filters
        for category, options in service_filters['service_options'].items(): # For each service category
            category_filters = {} # Track filters for this category
            for option, path in options.items(): # For each option in category
                value = request.args.get(option, '').lower() # Get parameter value
                if value in ['true', 'false']: # If valid boolean string
                    match_conditions.append({ # Add filter condition
                        f"places.{path}": value == 'true' # Match boolean value
                    })
                    category_filters[option] = value == 'true' # Track filter value
            
            if category_filters: # If any filters applied in this category
                if 'service_options' not in filters_applied: # If first service filter
                    filters_applied['service_options'] = {} # Initialize service options
                filters_applied['service_options'][category] = category_filters # Track category filters
            
        # Adds match conditions to pipeline
        if match_conditions: # If any conditions exist
            pipeline.append({ # Add filter conditions
                "$match": {"$and": match_conditions} # Must match all conditions
            })
            
        # Adds sorting stage
        valid_sort_fields = { # Define valid sort fields and their paths
            'name': 'places.info.name', # Sort by place name
            'rating': 'places.ratings.average_rating', # Sort by rating
            'review_count': 'places.ratings.review_count' # Sort by number of reviews
        }
        
        # Gets requested sort field
        requested_sort = request.args.get('sort_by', 'name') # Get sort field or default to name
        sort_field = valid_sort_fields.get(requested_sort, valid_sort_fields['name']) # Get valid path or default
        
        # Gets sort direction
        sort_order = request.args.get('sort_order', 'asc').lower() # Get sort order or default
        sort_direction = -1 if sort_order == 'desc' else 1 # Convert to MongoDB sort value
        
        # Adds sort to pipeline
        pipeline.append({"$sort": {sort_field: sort_direction}})
        
        # Adds pagination stages
        pipeline.append({"$skip": page_start}) # Skip to page start
        pipeline.append({"$limit": page_size}) # Limit results per page
        
        # Executes pipeline
        results = list(businesses.aggregate(pipeline)) # Run aggregation
        
        # Processes results
        places = [] 
        for result in results: # For each result
            if 'places' in result: # If result has places
                place = result['places'] # Get place data
                place = convert_objectid_to_str(place) # Convert IDs to strings
                places.append(place) # Add to places list
            
        # Gets total count for pagination
        count_pipeline = pipeline[:-2] # Remove pagination stages
        count_pipeline.append({"$count": "total"}) # Add count stage
        total_count = list(businesses.aggregate(count_pipeline)) # Get total count
        total_places = total_count[0]['total'] if total_count else 0 # Extract count
        
        # Adds sort to filters_applied
        filters_applied['sort'] = { # Track sort options
            'field': requested_sort, # Original requested field
            'direction': sort_order # Sort direction
        }
        
        # Returns response
        return make_response(jsonify({ 
            'places': places, # List of places
            'pagination': { # Pagination information
                'current_page': page_num, # Current page number
                'total_pages': (total_places + page_size - 1) // page_size, # Total pages
                'page_size': page_size, # Items per page
                'total_items': total_places # Total items count
            },
            'filters_applied': filters_applied # All applied filters including sort
        }), 200)

    except Exception as err:
        print(f"Error occurred: {err}") # Log the error
        return make_response(jsonify({ # Return error response
            "error": "Server error",
            "message": str(err)
        }), 500)

# Gets a specific food place from a city
@app.route("/api/cities/<city_id>/places/<place_id>", methods=["GET"]) # Route to get specific place
def show_one_place(city_id, place_id): # Function to show single place details
    try: # Try to handle potential errors
        print(f"Received city_id: {city_id}, place_id: {place_id}") # Debug print to check IDs
        
        if not ObjectId.is_valid(city_id): # Check if city ID format is valid
            return make_response(jsonify({ # Return error response
                "error": "Invalid city ID format"
            }), 404)
            
        # Find the city 
        city = businesses.find_one({ # Find specific city
            "_id": ObjectId(city_id) # Convert string to ObjectId
        })
        
        if not city: # If city not found
            return make_response(jsonify({ # Return error response
                "error": "City not found"
            }), 200)

        # Find the specific place
        place = None # Initialize place variable
        for p in city.get('places', []): # Loop through places
            if str(p.get('_id')) == place_id: # Compare as strings
                place = p # Store found place
                break # Exit loop
                
        if not place: # If place not found
            return make_response(jsonify({ # Return error response
                "error": "Place not found"
            }), 200)

        # Convert ObjectIds to strings
        place = convert_objectid_to_str(place) # Convert IDs in response
        
        # Return the place data
        return make_response(jsonify({ # Create JSON response
            "data": place, # Place details
            "links": { # Add HATEOAS links # Taken
                "city": f"/api/cities/{city_id}", # Link to parent city
                "self": f"/api/cities/{city_id}/places/{place_id}" # Link to this place
            }
        }), 200)
        
    except Exception as err: # Handles unexpected errors
        print(f"Error occurred: {err}") # Log the error
        return make_response(jsonify({ # Return error response
            "error": "Server error",
            "message": str(err)
        }), 500)
    
# Adds a new food place to a city
@app.route("/api/cities/<city_id>/places", methods=["POST"])
#@jwt_required
def add_new_place(city_id): 
    try: 
        # Validates city ID format
        if not ObjectId.is_valid(city_id): # Check if ID format is valid
            return make_response(jsonify({"error": "Invalid city ID format"}), 200)
        
        # Checks for JSON data
        if not request.is_json: # If request isn't JSON
            return make_response(jsonify({ # Return error response
                "error": "Request must be JSON"
            }), 400)
            
        place_data = request.json # Gets JSON data from request
        
        # Validates required fields
        required_fields = { # Define required fields and their types
            'place_id': str,
            'info': {
                'name': str,
                'type': list,
                'status': str
            },
            'location': {
                'address': {
                    'street': str,
                    'city': str,
                    'postcode': str
                },
                'coordinates': {
                    'latitude': float,
                    'longitude': float
                }
            }
        }
        
        # Checks if required fields exist
        if not all(field in place_data for field in required_fields): # Check top-level fields
            return make_response(jsonify({ # Return error if missing fields
                "error": "Missing required fields",
                "required": list(required_fields.keys())
            }), 200)
            
        # Validates nested structures
        if 'info' in place_data: # Check info structure
            if not all(field in place_data['info'] for field in required_fields['info']): # Check info fields
                return make_response(jsonify({ # Return error if missing info fields
                    "error": "Missing required info fields",
                    "required": list(required_fields['info'].keys())
                }), 200)
                
        if 'location' in place_data: # Check location structure
            if not all(field in place_data['location'] for field in ['address', 'coordinates']): # Check location fields
                return make_response(jsonify({ # Return error if missing location fields
                    "error": "Missing required location fields",
                    "required": ['address', 'coordinates']
                }), 200)
        
        # Generates new ObjectId for the place
        place_data['_id'] = ObjectId() # Create new MongoDB ID
        
        # Sets default values if not provided
        place_data.setdefault('ratings', { # Initialize ratings
            'average_rating': 0,
            'review_count': 0,
            'recent_reviews': []
        })
        
        place_data.setdefault('service_options', { # Initialize service options
            'dining': {
                'dine_in': False,
                'takeaway': False,
                'reservations': False,
                'outdoor_seating': False,
                'group_bookings': False
            },
            'meals': {
                'breakfast': False,
                'lunch': False,
                'dinner': False,
                'brunch': False
            }
        })
        
        place_data.setdefault('menu_options', { # Initialize menu options
            'food': {
                'vegetarian': False,
                'kids_menu': False
            },
            'drinks': {
                'coffee': False,
                'beer': False,
                'wine': False,
                'cocktails': False
            }
        })
        
        place_data.setdefault('amenities', { # Initialize amenities
            'facilities': {
                'restrooms': False,
                'wifi': False,
                'parking': False
            },
            'accessibility': {
                'wheelchair_access': False,
                'accessible_restroom': False,
                'accessible_seating': False
            }
        })
        
        # Adds the place to the city
        result = businesses.update_one( # Update the city document
            {"_id": ObjectId(city_id)}, # Find city by ID
            {"$push": {"places": place_data}} # Add new place to array
        )
        
        # Checks if city was found and updated
        if result.matched_count == 0: # If city not found
            return make_response(jsonify({ # Return error response
                "error": "City not found"
            }), 200)
            
        if result.modified_count == 0: # If update failed
            return make_response(jsonify({ # Return error response
                "error": "Failed to add place"
            }), 500)
        
        # Returns success response
        return make_response(jsonify({ # Create success response
            "message": "Place added successfully",
            "place_id": str(place_data['_id'])
        }), 200)
        
    except Exception as err: # Handles unexpected errors
        print(f"Error occurred: {err}") # Log the error
        return make_response(jsonify({ # Return error response
            "error": "Server error",
            "message": str(err)
        }), 500)

# Updates a food place in a city
@app.route("/api/cities/<city_id>/places/<place_id>", methods=["PUT"]) 
#@jwt_required
def update_place(city_id, place_id):
    try: 
        # Validates IDs format
        if not ObjectId.is_valid(city_id): # Check if city ID is valid
            return make_response(jsonify({ "error": "Invalid city ID format"}), 400)
            
        if not ObjectId.is_valid(place_id): # Check if place ID is valid
            return make_response(jsonify({"error": "Invalid place ID format"}), 400)
            
        # Validates request format
        if not request.is_json: # Check if request contains JSON
            return make_response(jsonify({"error": "Request must be JSON"}), 400)
            
        update_data = request.json # Get update data from request
        if not update_data: # If no update data provided
            return make_response(jsonify({"error": "No update data provided"}), 200)
            
        update_fields = {} # Builds update document
        
        # Updates basic info if provided
        if 'info' in update_data: # If info updates provided
            for field in ['name', 'type', 'status']: # For each info field
                if field in update_data['info']: # If field provided
                    update_fields[f"places.$.info.{field}"] = update_data['info'][field]
                    
        # Updates location if provided
        if 'location' in update_data: # If location updates provided
            location = update_data['location'] # Get location data
            if 'address' in location: # If address provided
                for field in ['street', 'city', 'postcode', 'full_address']: # For each address field
                    if field in location['address']: # If field provided
                        update_fields[f"places.$.location.address.{field}"] = location['address'][field]
            if 'coordinates' in location: # If coordinates provided
                for field in ['latitude', 'longitude']: # For each coordinate
                    if field in location['coordinates']: # If coordinate provided
                        update_fields[f"places.$.location.coordinates.{field}"] = float(location['coordinates'][field])
                        
        # Updates business hours if provided
        if 'business_hours' in update_data: # If hours updates provided
            hours = update_data['business_hours'] # Get hours data
            for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']: # For each day
                if day in hours: # If day provided
                    if 'open' in hours[day] and 'close' in hours[day]: # If both times provided
                        update_fields[f"places.$.business_hours.{day}"] = hours[day]
                        
        # Updates service options if provided
        if 'service_options' in update_data: # If service updates provided
            services = update_data['service_options'] # Get service data
            for category in ['dining', 'meals']: # For each category
                if category in services: # If category provided
                    for option, value in services[category].items(): # For each option
                        update_fields[f"places.$.service_options.{category}.{option}"] = bool(value)
                        
        # Updates menu options if provided
        if 'menu_options' in update_data: # If menu updates provided
            menu = update_data['menu_options'] # Get menu data
            for category in ['food', 'drinks']: # For each category
                if category in menu: # If category provided
                    for option, value in menu[category].items(): # For each option
                        update_fields[f"places.$.menu_options.{category}.{option}"] = bool(value)
                        
        # Updates amenities if provided
        if 'amenities' in update_data: # If amenities updates provided
            amenities = update_data['amenities'] # Get amenities data
            for category in ['facilities', 'accessibility']: # For each category
                if category in amenities: # If category provided
                    for option, value in amenities[category].items(): # For each option
                        update_fields[f"places.$.amenities.{category}.{option}"] = bool(value)

        # Checks if any updates were provided
        if not update_fields: # If no valid updates
            return make_response(jsonify({"error": "No valid update fields provided"}), 200)

        # Updates the place
        result = businesses.update_one( # Update the document
            {
                "_id": ObjectId(city_id), # Find city by ID
                "places._id": ObjectId(place_id) # Find place by ID
            },
            {"$set": update_fields} # Update specified fields
        )

        # Checks if place was found and updated
        if result.matched_count == 0: # If no document matched
            return make_response(jsonify({"error": "Place or city not found"}), 404)
            
        if result.modified_count == 0: # If no document modified
            return make_response(jsonify({"error": "No changes made to place"}), 400)

        # Returns success response
        return make_response(jsonify({
            "message": "Place updated successfully",
            "updated_fields": list(update_fields.keys())
        }), 200)

    except ValueError as err: # Handles value errors
        return make_response(jsonify({
            "error": "Invalid value in update data", "message": str(err)}), 400)

    except Exception as err: # Handles unexpected errors
        print(f"Error occurred: {err}") # Log the error
        return make_response(jsonify({"error": "Server error", "message": str(err)}), 500)

# Deletes a place from a city
@app.route("/api/cities/<city_id>/places/<place_id>", methods=["DELETE"]) 
#@jwt_required
#@admin_required
def delete_place(city_id, place_id):
    try: 
        if not ObjectId.is_valid(city_id): # Check if city ID is valid
            return make_response(jsonify({"error": "Invalid city ID format"}), 200)
            
        if not ObjectId.is_valid(place_id): # Check if place ID is valid
            return make_response(jsonify({ "error": "Invalid place ID format"}), 200)
        
        # Checks if city exists first
        city = businesses.find_one({ # Find the city
            "_id": ObjectId(city_id) # Using city ID
        })
        if not city: # If city not found
            return make_response(jsonify({"error": "City not found"}), 404)
            
        # Checks if place exists in city
        place_exists = any( # Check places array
            str(place.get('_id')) == str(ObjectId(place_id)) # Compare place IDs
            for place in city.get('places', []) # Loop through places
        )
        
        if not place_exists: # If place not found
            return make_response(jsonify({"error": "Place not found in city"}), 200)

        # Deletes the place
        result = businesses.update_one( # Update city document
            {"_id": ObjectId(city_id)}, # Find city by ID
            {
                "$pull": { "places": {"_id": ObjectId(place_id)}}
            } # Match place by I
        )
    
        # Checks if operation was successful
        if result.modified_count == 0: # If no document was modified
            return make_response(jsonify({"error": "Failed to delete place"}), 500)
        return make_response(jsonify({"message": "Place deleted successfully"}), 200) # Returns success response
        
    except Exception as err: # Handles unexpected errors
        print(f"Error occurred: {err}") # Log the error
        return make_response(jsonify({ # Return error response
            "error": "Server error",
            "message": str(err)
        }), 500)

# Updates place status (open/closed/temporary closed)
@app.route("/api/cities/<city_id>/places/<place_id>/status", methods=["PATCH"]) # Route to update place status
#@jwt_required
#@admin_required
def update_place_status(city_id, place_id): # Function to update place status
    try: # Try to handle potential errors
        # Validates IDs format
        if not ObjectId.is_valid(city_id): # Check if city ID is valid
            return make_response(jsonify({ # Return error if invalid
                "error": "Invalid city ID format"
            }), 400)
            
        if not ObjectId.is_valid(place_id): # Check if place ID is valid
            return make_response(jsonify({ # Return error if invalid
                "error": "Invalid place ID format"
            }), 400)
            
        # Validates request format
        if not request.is_json: # Check if request contains JSON
            return make_response(jsonify({ # Return error if not JSON
                "error": "Request must be JSON"
            }), 400)
            
        # Gets status from request
        status = request.json.get('status') # Get new status
        if not status: # If status not provided
            return make_response(jsonify({ # Return error response
                "error": "Status is required"
            }), 400)
        
        # Validates status value
        valid_statuses = ['operational', 'closed', 'temporary_closed'] # List of valid statuses
        if status not in valid_statuses: # If status is not valid
            return make_response(jsonify({ # Return error response
                "error": "Invalid status",
                "valid_statuses": valid_statuses
            }), 400)
        
        # Updates the place status
        result = businesses.update_one( # Update the document
            {
                "_id": ObjectId(city_id), # Find city by ID
                "places._id": ObjectId(place_id) # Find place by ID
            },
            {
                "$set": {"places.$.info.status": status} # Update status in info object
            }
        )
        
        # Checks if place was found and updated
        if result.matched_count == 0: # If no document matched
            return make_response(jsonify({ # Return error response
                "error": "Place or city not found"
            }), 404)
            
        if result.modified_count == 0: # If no document modified
            return make_response(jsonify({ # Return error response
                "error": "Status is already set to " + status
            }), 400)
        
        # Returns success response
        return make_response(jsonify({ # Return success response
            "message": f"Place status updated to {status}",
            "status": status
        }), 200)
        
    except Exception as err: # Handles unexpected errors
        print(f"Error occurred: {err}") # Log the error
        return make_response(jsonify({ # Return error response
            "error": "Server error",
            "message": str(err)
        }), 500)

''''''
# Review route
''''''
# Gets all reviews for a specific food place
@app.route("/api/cities/<city_id>/places/<place_id>/reviews", methods=["GET"]) 
def show_all_reviews(city_id, place_id): 
    try: 
        # Validates IDs format
        if not ObjectId.is_valid(city_id): # Check if city ID is valid
            return make_response(jsonify({ "error": "Invalid city ID format"}), 400)
            
        if not ObjectId.is_valid(place_id): # Check if place ID is valid
            return make_response(jsonify({"error": "Invalid place ID format"}), 400)
            
        # Gets pagination parameters
        page_num, page_size = validate_pagination_params( # Get and validate pagination
            request.args.get('pn'), # Page number from request
            request.args.get('ps') # Page size from request
        )
        page_start = (page_size * (page_num - 1)) # Calculate pagination start point

        # Sets up aggregation pipeline
        pipeline = [ # Initialize pipeline stages
            { # Match the specific city
                "$match": {
                    "_id": ObjectId(city_id) # Find by city ID
                }
            },
            { # Unwind places array
                "$unwind": "$places"
            },
            { # Match specific place
                "$match": {
                    "places._id": ObjectId(place_id) # Find by place ID
                }
            },
            { # Unwind reviews array
                "$unwind": "$places.ratings.recent_reviews"
            },
            { # Project review fields
                "$project": {
                    "review_id": "$places.ratings.recent_reviews.review_id",
                    "rating": "$places.ratings.recent_reviews.rating",
                    "author_name": "$places.ratings.recent_reviews.author_name",
                    "content": "$places.ratings.recent_reviews.content",
                    "date_posted": "$places.ratings.recent_reviews.date_posted",
                    "language": "$places.ratings.recent_reviews.language",
                    "_id": { "$toString": "$places.ratings.recent_reviews._id" }
                }
            }
        ]

        # Adds rating filter if provided
        min_rating = request.args.get('min_rating') # Get rating parameter
        if min_rating: # If rating provided
            try: # Try to convert rating
                min_rating_value = float(min_rating) # Convert to float
                if not 0 <= min_rating_value <= 5: # Validate rating range
                    return make_response(jsonify({"error": "Rating must be between 0 and 5"}), 400)
                pipeline.append({ # Add rating filter
                    "$match": {
                        "rating": {"$gte": min_rating_value} # Match minimum rating
                    }
                })
            except ValueError: # If conversion fails
                return make_response(jsonify({"error": "Invalid rating format"}), 400)

        # Adds date filters if provided
        start_date = request.args.get('start_date') # Get start date parameter
        if start_date: # If start date provided
            pipeline.append({ # Add start date filter
                "$match": {
                    "date_posted": {"$gte": start_date}
                }
            })

        end_date = request.args.get('end_date') # Get end date parameter
        if end_date: # If end date provided
            pipeline.append({ # Add end date filter
                "$match": {
                    "date_posted": {"$lte": end_date}
                }
            })

        # Adds sorting stage
        valid_sort_fields = ['date_posted', 'rating'] # Define valid sort fields
        sort_field = request.args.get('sort_by', 'date_posted') # Get sort field or default
        if sort_field not in valid_sort_fields: # Validate sort field
            return make_response(jsonify({"error": f"Invalid sort field. Must be one of: {valid_sort_fields}"}), 400)

        sort_order = request.args.get('sort_order', 'desc').lower() # Get sort order or default
        sort_direction = -1 if sort_order == 'desc' else 1 # Convert to MongoDB sort value

        # Adds sort and pagination
        pipeline.extend([ # Add final stages
            {"$sort": {sort_field: sort_direction}}, # Sort reviews
            {"$skip": page_start}, # Skip to page start
            {"$limit": page_size} # Limit results
        ])

        # Executes pipeline
        reviews = list(businesses.aggregate(pipeline)) # Run aggregation
        
        # Gets total count for pagination
        count_pipeline = pipeline[:-2] # Remove pagination stages
        count_pipeline.append({"$count": "total"}) # Add count stage
        total_count = list(businesses.aggregate(count_pipeline)) # Get total count
        total_reviews = total_count[0]['total'] if total_count else 0 # Extract count

        # Returns response
        response_data = { # Create response object
            'reviews': reviews, # List of reviews
            'pagination': { # Pagination information
                'current_page': page_num, # Current page number
                'total_pages': (total_reviews + page_size - 1) // page_size, # Total pages
                'page_size': page_size, # Items per page
                'total_items': total_reviews # Total reviews count
            },
            'filters_applied': { # Applied filters
                'min_rating': float(min_rating) if min_rating else None,
                'start_date': start_date if 'start_date' in locals() else None,
                'end_date': end_date if 'end_date' in locals() else None,
                'sort': {
                    'field': sort_field,
                    'direction': sort_order
                }
            }
        }
        
        # Returns JSON response
        return make_response(jsonify(response_data), 200)

    except Exception as err: # Handles unexpected errors
        print(f"Error occurred: {err}") # Log the error
        return make_response(jsonify({ # Return error response
            "error": "Server error",
            "message": str(err)
        }), 500)
    
# Gets a specific review for a food place
@app.route("/api/cities/<city_id>/places/<place_id>/reviews/<review_id>", methods=["GET"]) # Route to get specific review
def show_one_review(city_id, place_id, review_id): # Function to show single review
    try: # Try to handle potential errors
        # Validates IDs format
        if not ObjectId.is_valid(city_id): # Check if city ID is valid
            return make_response(jsonify({"error": "Invalid city ID format"}), 400)
            
        if not ObjectId.is_valid(place_id): # Check if place ID is valid
            return make_response(jsonify({"error": "Invalid place ID format"}), 200)
            
        if not ObjectId.is_valid(review_id): # Check if review ID is valid
            return make_response(jsonify({"error": "Invalid review ID format"}), 200)

        # Sets up aggregation pipeline
        pipeline = [ # Initialize pipeline stages
            { # Match the specific city
                "$match": {
                    "_id": ObjectId(city_id) # Find by city ID
                }
            },
            { # Unwind places array
                "$unwind": "$places"
            },
            { # Match specific place
                "$match": {
                    "places._id": ObjectId(place_id) # Find by place ID
                }
            },
            { # Unwind reviews array
                "$unwind": "$places.ratings.recent_reviews"
            },
            { # Match specific review
                "$match": {
                    "places.ratings.recent_reviews._id": ObjectId(review_id) # Find by review ID
                }
            },
            { # Project review fields
                "$project": {
                    "review_id": "$places.ratings.recent_reviews.review_id",
                    "rating": "$places.ratings.recent_reviews.rating",
                    "author_name": "$places.ratings.recent_reviews.author_name",
                    "content": "$places.ratings.recent_reviews.content",
                    "date_posted": "$places.ratings.recent_reviews.date_posted",
                    "language": "$places.ratings.recent_reviews.language",
                    "_id": { "$toString": "$places.ratings.recent_reviews._id" }
                }
            }
        ]

        # Executes pipeline
        result = list(businesses.aggregate(pipeline)) # Run aggregation
        
        # Checks if review was found
        if not result: # If no review found
            return make_response(jsonify({"error": "Review not found"}), 404)

        # Gets review data
        review = result[0] # Get first (and only) result
        
        # Returns the review
        return make_response(jsonify({ # Create JSON response
            "data": review, # Review details
            "links": { # Add HATEOAS links
                "city": f"/api/cities/{city_id}", # Link to city
                "place": f"/api/cities/{city_id}/places/{place_id}", # Link to place
                "self": f"/api/cities/{city_id}/places/{place_id}/reviews/{review_id}" # Link to this review
            }
        }), 200)

    except Exception as err: # Handles unexpected errors
        print(f"Error occurred: {err}") # Log the error
        return make_response(jsonify({"error": "Server error","message": str(err)}), 500)
    
# Adds a new review
@app.route("/api/cities/<city_id>/places/<place_id>/reviews", methods=["POST"]) # Route to add review
#@jwt_required # Requires valid token
def add_new_review(city_id, place_id): # Function to add review
    try: # Try to handle potential errors
        if not ObjectId.is_valid(city_id): # Check if city ID is valid
            return make_response(jsonify({
                "error": "Invalid city ID format"
            }), 400)

        if not ObjectId.is_valid(place_id): # Check if place ID is valid
            return make_response(jsonify({
                "error": "Invalid place ID format"
            }), 400)
            
        if not request.is_json: # Check for JSON
            return make_response(jsonify({
                "error": "Request must be JSON"
            }), 400)
            
        review_data = request.json # Get review data
        
        required_fields = ['rating', 'author_name', 'content'] # Required fields
        for field in required_fields: # Check all fields
            if field not in review_data:
                return make_response(jsonify({
                    "error": f"Missing required field: {field}"
                }), 400)
                
        try: # Check rating value
            rating = float(review_data['rating'])
            if not 1 <= rating <= 5:
                return make_response(jsonify({
                    "error": "Rating must be between 1 and 5"
                }), 400)
        except ValueError:
            return make_response(jsonify({
                "error": "Rating must be a number"
            }), 400)

        new_review = { # Create review object
            "_id": ObjectId(),
            "review_id": f"rev_{str(ObjectId())[-6:]}",
            "rating": rating,
            "author_name": review_data['author_name'],
            "content": review_data['content'],
            "date_posted": datetime.datetime.now(datetime.UTC).isoformat(),
            "language": review_data.get('language', 'en')
        }

        result = businesses.update_one( # Add review to place
            {
                "_id": ObjectId(city_id),
                "places._id": ObjectId(place_id)
            },
            {
                "$push": {
                    "places.$.ratings.recent_reviews": new_review
                }
            }
        )

        if result.matched_count == 0: # Check if place exists
            return make_response(jsonify({
                "error": "City or place not found"
            }), 404)
            
        if result.modified_count == 0: # Check if update worked
            return make_response(jsonify({
                "error": "Failed to add review"
            }), 500)

        businesses.update_one( # Update review count
            {
                "_id": ObjectId(city_id),
                "places._id": ObjectId(place_id)
            },
            {
                "$inc": {
                    "places.$.ratings.review_count": 1
                }
            }
        )

        pipeline = [ # Calculate new rating
            {"$match": {"_id": ObjectId(city_id)}},
            {"$unwind": "$places"},
            {"$match": {"places._id": ObjectId(place_id)}},
            {"$unwind": "$places.ratings.recent_reviews"},
            {"$group": {
                "_id": None,
                "average": {"$avg": "$places.ratings.recent_reviews.rating"}
            }}
        ]
        
        avg_result = list(businesses.aggregate(pipeline)) # Get new average
        if avg_result: # Update average rating
            businesses.update_one(
                {
                    "_id": ObjectId(city_id),
                    "places._id": ObjectId(place_id)
                },
                {
                    "$set": {
                        "places.$.ratings.average_rating": round(avg_result[0]['average'], 1)
                    }
                }
            )

        return make_response(jsonify({ # Return success
            "message": "Review added successfully",
            "review": {
                "id": str(new_review['_id']),
                "review_id": new_review['review_id']
            }
        }), 201)

    except Exception as err: # Handle any errors
        print(f"Error occurred: {err}")
        return make_response(jsonify({
            "error": "Server error",
            "message": str(err)
        }), 500)

@app.route("/api/cities/<city_id>/places/<place_id>/reviews/<review_id>", methods=["PUT"]) # Route to update review
#@jwt_required # Requires valid token
def update_review(city_id, place_id, review_id): # Function to update review
    try: # Try to handle potential errors
        if not ObjectId.is_valid(city_id): # Check if city ID is valid
            return make_response(jsonify({"error": "Invalid city ID format"}), 400)
            
        if not ObjectId.is_valid(place_id): # Check if place ID is valid
            return make_response(jsonify({"error": "Invalid place ID format"}), 400)
            
        if not ObjectId.is_valid(review_id): # Check if review ID is valid
            return make_response(jsonify({"error": "Invalid review ID format"}), 400)
            
        if not request.is_json: # Check for JSON data
            return make_response(jsonify({"error": "Request must be JSON"}), 400)
            
        review_data = request.json # Get update data
        
        # Validate required fields
        if 'rating' in review_data: # Validate rating if provided
            try: # Convert rating to float
                rating = float(review_data['rating'])
                if not 1 <= rating <= 5: # Check rating range
                    return make_response(jsonify({"error": "Rating must be between 1 and 5"}), 400)
            except ValueError: # If conversion fails
                return make_response(jsonify({"error": "Rating must be a number"}), 400)
        
        # Build update fields
        update_fields = {} 
        
        if 'rating' in review_data: # Add rating if provided
            update_fields['places.$.ratings.recent_reviews.$[review].rating'] = rating
            
        if 'content' in review_data: # Add content if provided
            update_fields['places.$.ratings.recent_reviews.$[review].content'] = review_data['content']
            
        if 'author_name' in review_data: # Add author if provided
            update_fields['places.$.ratings.recent_reviews.$[review].author_name'] = review_data['author_name']
            
        # Update timestamp
        update_fields['places.$.ratings.recent_reviews.$[review].date_posted'] = \
            datetime.datetime.now(datetime.UTC).isoformat()
        
        # Update the review
        result = businesses.update_one(
            {
                "_id": ObjectId(city_id),
                "places._id": ObjectId(place_id)
            },
            {"$set": update_fields},
            array_filters=[{"review._id": ObjectId(review_id)}]
        )
        
        if result.matched_count == 0: # Check if found
            return make_response(jsonify({
                "error": "City or place not found"
            }), 404)
            
        if result.modified_count == 0: # Check if updated
            return make_response(jsonify({
                "error": "Review not found or no changes made"
            }), 404)
            
        # Update average rating if rating changed
        if 'rating' in review_data: # Recalculate if rating changed
            pipeline = [ # Calculate new rating
                {"$match": {"_id": ObjectId(city_id)}},
                {"$unwind": "$places"},
                {"$match": {"places._id": ObjectId(place_id)}},
                {"$unwind": "$places.ratings.recent_reviews"},
                {"$group": {
                    "_id": None,
                    "average": {"$avg": "$places.ratings.recent_reviews.rating"}
                }}
            ]
            
            avg_result = list(businesses.aggregate(pipeline)) # Get new average
            if avg_result: # Update average rating
                businesses.update_one(
                    {
                        "_id": ObjectId(city_id),
                        "places._id": ObjectId(place_id)
                    },
                    {
                        "$set": {
                            "places.$.ratings.average_rating": round(avg_result[0]['average'], 1)
                        }
                    }
                )
            
        return make_response(jsonify({"message": "Review updated successfully"}), 200)
        
    except Exception as err: # Handle any errors
        print(f"Error occurred: {err}")
        return make_response(jsonify({
            "error": "Server error",
            "message": str(err)
        }), 500)

# Deletes a review from a food place
@app.route("/api/cities/<city_id>/places/<place_id>/reviews/<review_id>", methods=["DELETE"]) # Route to delete review
#@jwt_required # Requires valid token
#@admin_required # Requires admin privileges
def delete_review(city_id, place_id, review_id): # Function to delete review
    try: # Try to handle potential errors
        if not ObjectId.is_valid(city_id): # Check if city ID is valid
            return make_response(jsonify({"error": "Invalid city ID format"}), 400)
        if not ObjectId.is_valid(place_id): # Check if place ID is valid
            return make_response(jsonify({"error": "Invalid place ID format"}), 400)   
        if not ObjectId.is_valid(review_id): # Check if review ID is valid
            return make_response(jsonify({"error": "Invalid review ID format"}), 400)
            
        # Remove the review
        result = businesses.update_one(
            {
                "_id": ObjectId(city_id),
                "places._id": ObjectId(place_id)
            },
            {
                "$pull": {
                    "places.$.ratings.recent_reviews": {
                        "_id": ObjectId(review_id)
                    }
                }
            }
        )
        
        if result.matched_count == 0: # Check if place exists
            return make_response(jsonify({"error": "City or place not found"}), 404)
        if result.modified_count == 0: # Check if review was deleted
            return make_response(jsonify({"error": "Review not found"  }), 404)
            
        # Update review count
        businesses.update_one(
            {
                "_id": ObjectId(city_id),
                "places._id": ObjectId(place_id)
            },
            {
                "$inc": {
                    "places.$.ratings.review_count": -1
                }
            }
        )
        
        # Recalculate average rating
        pipeline = [ # Calculate new rating
            {"$match": {"_id": ObjectId(city_id)}},
            {"$unwind": "$places"},
            {"$match": {"places._id": ObjectId(place_id)}},
            {"$unwind": "$places.ratings.recent_reviews"},
            {"$group": {
                "_id": None,
                "average": {"$avg": "$places.ratings.recent_reviews.rating"}
            }}
        ]
        
        avg_result = list(businesses.aggregate(pipeline)) # Get new average
        if avg_result: # Update average rating
            businesses.update_one(
                {
                    "_id": ObjectId(city_id),
                    "places._id": ObjectId(place_id)
                },
                {
                    "$set": {
                        "places.$.ratings.average_rating": round(avg_result[0]['average'], 1)
                    }
                }
            )
        else: # If no reviews left
            businesses.update_one(
                {
                    "_id": ObjectId(city_id),
                    "places._id": ObjectId(place_id)
                },
                {
                    "$set": {
                        "places.$.ratings.average_rating": 0
                    }
                }
            )  
        return make_response(jsonify({ # Return success
            "message": "Review deleted successfully"
        }), 200)
        
    except Exception as err: # Handle any errors
        print(f"Error occurred: {err}")
        return make_response(jsonify({
            "error": "Server error",
            "message": str(err)
        }), 500)

# Update place rating
@app.route("/api/cities/<city_id>/places/<place_id>/update-rating", methods=["POST"]) # Route to update rating
#@jwt_required # Requires valid token
def update_place_rating(city_id, place_id): # Function to update place rating
    try: # Try to handle potential errors
        if not ObjectId.is_valid(city_id): # Check if city ID is valid
            return make_response(jsonify({"error": "Invalid city ID format"}), 400)
            
        if not ObjectId.is_valid(place_id): # Check if place ID is valid
            return make_response(jsonify({"error": "Invalid place ID format"}), 400)

        # Calculate new rating
        pipeline = [ # Aggregation pipeline
            {"$match": {"_id": ObjectId(city_id)}}, # Match city
            {"$unwind": "$places"}, # Unwind places
            {"$match": {"places._id": ObjectId(place_id)}}, # Match place
            {"$unwind": "$places.ratings.recent_reviews"}, # Unwind reviews
            {
                "$group": { # Group and calculate
                    "_id": "$places._id", # Group by place
                    "average_rating": {"$avg": "$places.ratings.recent_reviews.rating"}, # Average rating
                    "review_count": {"$sum": 1} # Count reviews
                }
            }
        ]

        result = list(businesses.aggregate(pipeline)) # Run pipeline
        
        if result: # If reviews exist
            # Update place ratings
            update_result = businesses.update_one(
                {
                    "_id": ObjectId(city_id),
                    "places._id": ObjectId(place_id)
                },
                {
                    "$set": {
                        "places.$.ratings.average_rating": round(result[0]['average_rating'], 1),
                        "places.$.ratings.review_count": result[0]['review_count']
                    }
                }
            )
            
            if update_result.matched_count == 0: # Check if place exists
                return make_response(jsonify({"error": "City or place not found"}), 404)

            # Return updated ratings
            return make_response(jsonify({
                "message": "Rating updated successfully",
                "ratings": {
                    "average_rating": round(result[0]['average_rating'], 1),
                    "review_count": result[0]['review_count']
                }
            }), 200)
            
        else: # If no reviews
            # Reset ratings to zero
            update_result = businesses.update_one(
                {
                    "_id": ObjectId(city_id),
                    "places._id": ObjectId(place_id)
                },
                {
                    "$set": {
                        "places.$.ratings.average_rating": 0,
                        "places.$.ratings.review_count": 0
                    }
                }
            )
            
            if update_result.matched_count == 0: # Check if place exists
                return make_response(jsonify({"error": "City or place not found"}), 404)

            # Return reset ratings
            return make_response(jsonify({
                "message": "Rating reset to zero (no reviews found)",
                "ratings": {
                    "average_rating": 0,
                    "review_count": 0
                }
            }), 200)
    
    except Exception as err: # Handle any errors
        print(f"Error occurred: {err}")
        return make_response(jsonify({"error": "Server error","message": str(err)}), 500)

if __name__ == "__main__":
    app.run(debug = True, port = 2000)