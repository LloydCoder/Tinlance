from tinlance import TinlanceClient

def test_key_validation():
    try:
        TinlanceClient("bad")
    except ValueError:
        return
    assert False
