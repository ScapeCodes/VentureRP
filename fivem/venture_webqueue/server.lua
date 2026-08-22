local apiUrl = GetConvar('venture_queue_api', 'https://venture-rp-api.noscapedev.workers.dev')
local serverSecret = GetConvar('venture_queue_secret', '')

local function discordIdentifier(player)
    for _, identifier in ipairs(GetPlayerIdentifiers(player)) do
        if identifier:sub(1, 8) == 'discord:' then
            return identifier:sub(9)
        end
    end
    return nil
end

AddEventHandler('playerConnecting', function(_, _, deferrals)
    local player = source
    deferrals.defer()
    Wait(0)

    if serverSecret == '' then
        print('^1[venture_webqueue] venture_queue_secret is not configured.^7')
        deferrals.done('The Venture website queue is not configured. Please contact staff.')
        return
    end

    local discordId = discordIdentifier(player)
    if not discordId then
        deferrals.done('Discord must be open and linked to FiveM before joining Venture.')
        return
    end

    deferrals.update('Venture is verifying your website queue reservation...')
    PerformHttpRequest(apiUrl .. '/api/fivem/admit', function(status, response)
        local ok, result = pcall(json.decode, response or '')
        if status == 200 and ok and result and result.allowed then
            deferrals.done()
            return
        end

        local reason = ok and result and result.reason or nil
        if status == 401 then
            print('^1[venture_webqueue] Worker rejected the configured queue secret.^7')
            reason = 'The Venture queue connection is misconfigured. Please contact staff.'
        elseif status == 0 or status >= 500 then
            reason = 'The Venture queue service is temporarily unavailable. Please try again shortly.'
        end
        deferrals.done(reason or 'Join the queue at https://scapecodes.github.io/VentureRP/ before connecting.')
    end, 'POST', json.encode({ discordId = discordId }), {
        ['Authorization'] = 'Bearer ' .. serverSecret,
        ['Content-Type'] = 'application/json'
    })
end)
