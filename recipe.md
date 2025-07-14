# Objective

Create an MCP server for searching restaurant reservations and guiding users to a reservation page. 

The plan is to have an MCP server that can be plugged into Claude.ai (for example). 

1. A user can search for available restaurants, sometimes at a specific time, etc.. 

2. Once they've chosen a restaurant the next step is to search the specific store, confirm that a reservation is available at a time that they want. If it's unclear when the user wants a reservation, list reservation times for them (for the specific restaurant)

# Assumptions

- assume a locale of "en" or "jp"

# Technology

Create an MCP server  using node, specifically typescript.

Please refer to the SDK: https://github.com/modelcontextprotocol/typescript-sdk

Please use mise to install whichever node version is appropriate for the SDK.

# MCP API

1. an MCP endpoint for searching for a restaurant
 - use TableCheck API to search for restaurants.
 - two MCP endpoints (one for text search, one for param shop_search is fine, but combining them into a single endpoint)

2. an MCP endpoint for listing cuisines

3. an MCP endpoint for getting the availability of a specific shop

4. an endpoint for generating a restaurant url for the use to visit could be handy, but also there using the slug returned in the search api and building the url is fine too.

# TABLECHECK API

1. SEARCH SHOP: Search a shop. 

Here are some examples of search requests to tablecheck:

```bash
curl --header "Content-Type: application/json" \
  --request GET \
  https://production.tablecheck.com/v2/shop_search?availability_days_limit=7&availability_format=date&budget_dinner_avg_max=14000&date_min=2025-07-14&date_max=2025-09-12&geo_distance=8km&service_mode=dining&sort_by=distance&venue_type=all&geo_latitude=35.32706053082282&geo_longitude=139.62749215920184&num_people=2&time=19%3A00&availability_mode=same_meal_time&per_page=50&randomize_geo=1234&shop_universe_id=57e0b91744aea12988000001&include_ids=true
```

```bash
curl --header "Content-Type: application/json" \
  --request GET \
  https://production.tablecheck.com/v2/shop_search?availability_days_limit=7&availability_format=date&date_min=2025-07-14&date_max=2025-09-12&geo_distance=8km&service_mode=dining&sort_by=distance&venue_type=all&geo_latitude=35.32706053082282&geo_longitude=139.62749215920184&per_page=50&randomize_geo=1234&shop_universe_id=57e0b91744aea12988000001&include_ids=true
```

```bash
curl --header "Content-Type: application/json" \
  --request GET \
  https://production.tablecheck.com/v2/shop_search?availability_days_limit=7&availability_format=date&date_min=2025-07-14&date_max=2025-09-12&geo_distance=5km&service_mode=dining&sort_by=distance&venue_type=all&geo_latitude=35.32706053082282&geo_longitude=139.62749215920184&per_page=50&randomize_geo=1234&shop_universe_id=57e0b91744aea12988000001&include_ids=true
```

Here is an example with cuisines in the params:

```bash
curl --header "Content-Type: application/json" \
  --request GET \
https://production.tablecheck.com/v2/shop_search?availability_days_limit=7&availability_format=date&budget_dinner_avg_max=14000&date_min=2025-07-14&date_max=2025-09-12&geo_distance=14km&service_mode=dining&sort_by=distance&venue_type=all&geo_longitude=139.62749215920184&geo_latitude=35.32706053082282&num_people=2&time=19%3A00&availability_mode=same_meal_time&cuisines%5B%5D=agemono&cuisines%5B%5D=asian-noodles&per_page=50&randomize_geo=1234&shop_universe_id=57e0b91744aea12988000001&include_ids=true
```

The various params are encoded in the URL. 

- An example empty response can be found in `./assets/search_empty.json`
- A example typical response with results can be found in `./assets/search.json`

Some extra notes:

- geo_distance and sort_by=distance etc. only make sense if a geo latitude and logitude are provided.

- assume service_mode is dining

- shop_universe_id is `57e0b91744aea12988000001`

- you may need to ask the user for a location, otherwise assume some central location in tokyo as the anchor point. 

- sorting options are distance and price

## List Cusines

One of the search params is cusines (it's an optional param), but to get a full list: 

```bash
curl --header "Content-Type: application/json" \
  --request GET \
  https://production.tablecheck.com/v2/cuisines
```

An example response can be found in `./assets/cuisines.json` which has results for each locale. 

## Search text

you can search by specific text using the following api:

```bash
curl --header "Content-Type: application/json" \
  --request GET \
https://production.tablecheck.com/v2/autocomplete?locale=en&text=indian&shop_universe_id=57e0b91744aea12988000001
```

if a text param isn't included then the following is returned:

```json
{
    "errors": [
        "Required parameter missing: text"
    ]
}
```

A typical response is in `./assets/autocomplete.json`

At a top level the response includes cruisines and/or shops. 

if there are no cuisines then it's not included at all in the response.

same with shops.

if neither exist, an empty object `{}` is returned. 


## Availability Calendar of a shop

To get the availability of a specific shop:

`curl
curl --header "Content-Type: application/json" \
  --request POST \
  https://production.tablecheck.com/v2/hub/availability_calendar
```

and the request body is:

```json
{
    "locale": "en",
    "start_at": "2025-07-15T10:00:00.000Z",
    "shop_id": "hyatt-regency-yokohama-milanogrill",
    "num_people": "2"
}
```

In the above case the shop was the hyatt-regency-yokohama-milanogrill (https://www.tablecheck.com/en/hyatt-regency-yokohama-milanogrill)


# Generating a link for a shop:

A link that the user can visit will typically look like: 

https://www.tablecheck.com/en/hyatt-regency-yokohama-milanogrill?availability_days_limit=7&availability_format=date&budget_dinner_avg_min=9000&date_min=2025-07-14&date_max=2025-09-12&geo_distance=28km&service_mode=dining&sort_by=budget_dinner_avg&venue_type=all&geo_longitude=139.62749215920184&geo_latitude=35.32706053082282&num_people=2&time=19:00&availability_mode=same_meal_time&sort_order=asc

that shows the specific shop and has a bunch of prefilled filter params.

Such a link would ideally be what is returned to the customer so they can make a reservation.




