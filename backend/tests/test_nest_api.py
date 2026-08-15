import os, requests, uuid
BASE_URL=os.environ.get('REACT_APP_BACKEND_URL','https://nest-property-hub-2.preview.emergentagent.com').rstrip('/')

def test_root_and_listings():
    r=requests.get(BASE_URL+'/api/'); assert r.status_code==200; assert r.json()['message']
    r=requests.get(BASE_URL+'/api/listings'); assert r.status_code==200
    data=r.json(); assert len(data)>=4; assert all('id' in x and 'rent' in x for x in data)

def test_listing_filters():
    r=requests.get(BASE_URL+'/api/listings',params={'city':'Kolkata','max_rent':60000,'property_type':'Apartment'})
    assert r.status_code==200; data=r.json(); assert len(data)>=1; assert all(x['city']=='Kolkata' and x['rent']<=60000 and x['type']=='Apartment' for x in data)

def test_booking_maintenance_contact():
    suffix=str(uuid.uuid4())
    booking={'listing_id':'seed-test','date':'2026-04-05','time':'10:00 AM','name':'TEST '+suffix,'phone':'+919000000000'}
    r=requests.post(BASE_URL+'/api/bookings',json=booking); assert r.status_code==200; assert r.json()['ok'] and r.json()['id']
    r=requests.post(BASE_URL+'/api/maintenance',json={'property':'TEST '+suffix,'category':'Plumbing','title':'TEST tap','description':'TEST issue','priority':'Medium'})
    assert r.status_code==200; assert r.json()['ok']; assert r.json()['request']['status']=='Submitted'
    r=requests.post(BASE_URL+'/api/contact',json={'name':'TEST','email':'test@example.com','subject':'TEST','message':'TEST'})
    assert r.status_code==200; assert r.json()['ok'] is True
