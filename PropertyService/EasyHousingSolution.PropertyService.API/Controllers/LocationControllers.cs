using EasyHousingSolution.PropertyService.Application.DTOs;
using EasyHousingSolution.PropertyService.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EasyHousingSolution.PropertyService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Tags("Location")]
public class StatesController : ControllerBase
{
    private readonly ILocationAppService _locationService;

    public StatesController(ILocationAppService locationService)
    {
        _locationService = locationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllStates()
    {
        var states = await _locationService.GetAllStatesAsync();
        return Ok(states);
    }
}

[ApiController]
[Route("api/[controller]")]
[Tags("Location")]
public class CitiesController : ControllerBase
{
    private readonly ILocationAppService _locationService;

    public CitiesController(ILocationAppService locationService)
    {
        _locationService = locationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCities()
    {
        var cities = await _locationService.GetAllCitiesAsync();
        return Ok(cities);
    }
}
